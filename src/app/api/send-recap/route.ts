import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { formatCurrency, formatDate } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { period } = await request.json();

    // Get user from session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map((c) => ({
              name: c.name,
              value: c.value,
            }));
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = user.email;
    const userName = user.user_metadata?.full_name || "User";

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 400 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    if (period === "weekly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = now.toISOString().split("T")[0];

    // Fetch data
    const [financeRes, notesRes, shoppingRes, remindersRes] = await Promise.all([
      supabase
        .from("finance_records")
        .select("type, category, amount, transaction_date")
        .eq("user_id", user.id)
        .gte("transaction_date", startStr)
        .lte("transaction_date", endStr),

      supabase
        .from("notes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString()),

      supabase
        .from("shopping_lists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString()),

      supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .gte("updated_at", startDate.toISOString()),
    ]);

    // Process finance data
    const records = financeRes.data || [];
    const totalIncome = records
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + r.amount, 0);
    const balance = totalIncome - totalExpense;

    // Top expense categories
    const categoryMap = new Map<string, number>();
    records
      .filter((r) => r.type === "expense")
      .forEach((r) => {
        const current = categoryMap.get(r.category) || 0;
        categoryMap.set(r.category, current + r.amount);
      });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent transactions
    const recentTransactions = records
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5);

    const periodLabel = period === "weekly" ? "Minggu Ini" : "Bulan Ini";

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #ffb6c9, #8b5cf6); border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Rekap Keuangan</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">${periodLabel}</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Halo ${userName},</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">Berikut rekap keuangan kamu ${periodLabel.toLowerCase()}:</p>

            <!-- Summary Cards -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px; background: #f0fdf4; border-radius: 12px; width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Pemasukan</p>
                  <p style="color: #059669; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">${formatCurrency(totalIncome)}</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #fef2f2; border-radius: 12px; width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Pengeluaran</p>
                  <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">${formatCurrency(totalExpense)}</p>
                </td>
                <td style="width: 2%;"></td>
                <td style="padding: 16px; background: #fdf2f8; border-radius: 12px; width: 33%;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">Saldo</p>
                  <p style="color: ${balance >= 0 ? '#059669' : '#dc2626'}; font-size: 18px; font-weight: 700; margin: 4px 0 0 0;">${formatCurrency(balance)}</p>
                </td>
              </tr>
            </table>

            ${topCategories.length > 0 ? `
            <!-- Top Expenses -->
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Pengeluaran Terbesar</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              ${topCategories.map((cat, i) => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #9ca3af; font-size: 14px; width: 24px;">${i + 1}.</td>
                  <td style="padding: 10px 0; color: #374151; font-size: 14px;">${cat.category}</td>
                  <td style="padding: 10px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(cat.amount)}</td>
                </tr>
              `).join('')}
            </table>
            ` : ''}

            <!-- Activity -->
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Aktivitas</h3>
            <ul style="padding: 0; margin: 0 0 24px 0; list-style: none;">
              <li style="padding: 8px 0; color: #4b5563; font-size: 14px; border-bottom: 1px solid #f3f4f6;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #f3e8ff; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; font-size: 12px;">📝</span>
                ${notesRes.count || 0} catatan baru
              </li>
              <li style="padding: 8px 0; color: #4b5563; font-size: 14px; border-bottom: 1px solid #f3f4f6;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #fff7ed; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; font-size: 12px;">🛒</span>
                ${shoppingRes.count || 0} daftar belanja baru
              </li>
              <li style="padding: 8px 0; color: #4b5563; font-size: 14px;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #dbeafe; border-radius: 6px; text-align: center; line-height: 24px; margin-right: 8px; font-size: 12px;">✅</span>
                ${remindersRes.count || 0} reminder selesai
              </li>
            </ul>

            ${recentTransactions.length > 0 ? `
            <!-- Recent Transactions -->
            <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">Transaksi Terakhir</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              ${recentTransactions.map((t) => {
                const isIncome = t.type === "income";
                return `
                  <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0;">
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; ${isIncome ? 'background: #f0fdf4; color: #059669;' : 'background: #fef2f2; color: #dc2626;'}">
                        ${isIncome ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td style="padding: 10px 0; color: #374151; font-size: 14px;">${t.category}</td>
                    <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(t.amount)}</td>
                    <td style="padding: 10px 0; color: #9ca3af; font-size: 12px; text-align: right;">${formatDate(t.transaction_date)}</td>
                  </tr>
                `;
              }).join('')}
            </table>
            ` : ''}

            <!-- Footer -->
            <div style="border-top: 2px solid #fce7f3; padding-top: 20px; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                Dikirim oleh WeWallet &bull; ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const { data, error } = await resend.emails.send({
      from: "WeWallet <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Rekap Keuangan ${periodLabel} - WeWallet`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Rekap berhasil dikirim ke ${userEmail}`,
      data,
    });
  } catch (error) {
    console.error("Send recap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
