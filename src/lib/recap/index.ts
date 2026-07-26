import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface RecapData {
  period: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  notesCount: number;
  shoppingListsCount: number;
  completedReminders: number;
  recentTransactions: Array<{
    type: "income" | "expense";
    category: string;
    amount: number;
    date: string;
  }>;
}

export async function generateRecapData(period: "weekly" | "monthly"): Promise<RecapData> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

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

  // Fetch data in parallel
  const [
    financeRes,
    notesRes,
    shoppingRes,
    remindersRes,
    recentFinanceRes,
  ] = await Promise.all([
    // Finance records for the period
    supabase
      .from("finance_records")
      .select("type, category, amount, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", startStr)
      .lte("transaction_date", endStr),

    // Notes count
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString()),

    // Shopping lists count
    supabase
      .from("shopping_lists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString()),

    // Completed reminders
    supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .gte("updated_at", startDate.toISOString()),

    // Recent transactions (last 5)
    supabase
      .from("finance_records")
      .select("type, category, amount, transaction_date")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(5),
  ]);

  // Calculate totals
  const records = financeRes.data || [];
  const totalIncome = records
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  // Calculate top expense categories
  const categoryMap = new Map<string, number>();
  records
    .filter((r) => r.type === "expense")
    .forEach((r) => {
      const current = categoryMap.get(r.category) || 0;
      categoryMap.set(r.category, current + r.amount);
    });

  const topExpenseCategories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    period: period === "weekly" ? "Minggu Ini" : "Bulan Ini",
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    topExpenseCategories,
    notesCount: notesRes.count || 0,
    shoppingListsCount: shoppingRes.count || 0,
    completedReminders: remindersRes.count || 0,
    recentTransactions: (recentFinanceRes.data || []).map((r) => ({
      type: r.type as "income" | "expense",
      category: r.category,
      amount: r.amount,
      date: r.transaction_date,
    })),
  };
}

export function formatRecapEmail(data: RecapData): string {
  const lines: string[] = [];

  lines.push(`Rekap Keuangan ${data.period}`);
  lines.push("================================");
  lines.push("");

  lines.push("Ringkasan:");
  lines.push(`- Total Pemasukan: ${formatCurrency(data.totalIncome)}`);
  lines.push(`- Total Pengeluaran: ${formatCurrency(data.totalExpense)}`);
  lines.push(`- Saldo: ${formatCurrency(data.balance)}`);
  lines.push("");

  if (data.topExpenseCategories.length > 0) {
    lines.push("Pengeluaran Terbesar:");
    data.topExpenseCategories.forEach((cat, i) => {
      lines.push(`${i + 1}. ${cat.category}: ${formatCurrency(cat.amount)}`);
    });
    lines.push("");
  }

  lines.push("Aktivitas:");
  lines.push(`- ${data.notesCount} catatan baru`);
  lines.push(`- ${data.shoppingListsCount} daftar belanja baru`);
  lines.push(`- ${data.completedReminders} reminder selesai`);
  lines.push("");

  if (data.recentTransactions.length > 0) {
    lines.push("Transaksi Terakhir:");
    data.recentTransactions.forEach((t) => {
      const type = t.type === "income" ? "Masuk" : "Keluar";
      lines.push(`- [${type}] ${t.category}: ${formatCurrency(t.amount)} (${formatDate(t.date)})`);
    });
  }

  lines.push("");
  lines.push("================================");
  lines.push("Dikirim oleh WeWallet");

  return lines.join("\n");
}

export function formatRecapHtml(data: RecapData): string {
  let html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ec4899; margin-bottom: 4px;">Rekap Keuangan ${data.period}</h2>
      <hr style="border: 1px solid #fce7f3; margin-bottom: 20px;">
      
      <h3 style="color: #374151; font-size: 16px;">Ringkasan</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Pemasukan</td>
          <td style="padding: 8px 0; text-align: right; color: #059669; font-weight: 600;">${formatCurrency(data.totalIncome)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Pengeluaran</td>
          <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">${formatCurrency(data.totalExpense)}</td>
        </tr>
        <tr style="border-top: 2px solid #fce7f3;">
          <td style="padding: 12px 0; color: #111827; font-weight: 600;">Saldo</td>
          <td style="padding: 12px 0; text-align: right; color: ${data.balance >= 0 ? '#059669' : '#dc2626'}; font-weight: 700; font-size: 18px;">${formatCurrency(data.balance)}</td>
        </tr>
      </table>`;

  if (data.topExpenseCategories.length > 0) {
    html += `
      <h3 style="color: #374151; font-size: 16px;">Pengeluaran Terbesar</h3>
      <ol style="padding-left: 20px; margin-bottom: 20px;">`;
    data.topExpenseCategories.forEach((cat) => {
      html += `<li style="padding: 4px 0; color: #4b5563;">${cat.category}: <strong>${formatCurrency(cat.amount)}</strong></li>`;
    });
    html += `</ol>`;
  }

  html += `
      <h3 style="color: #374151; font-size: 16px;">Aktivitas</h3>
      <ul style="padding-left: 20px; margin-bottom: 20px;">
        <li style="padding: 4px 0; color: #4b5563;">${data.notesCount} catatan baru</li>
        <li style="padding: 4px 0; color: #4b5563;">${data.shoppingListsCount} daftar belanja baru</li>
        <li style="padding: 4px 0; color: #4b5563;">${data.completedReminders} reminder selesai</li>
      </ul>`;

  if (data.recentTransactions.length > 0) {
    html += `
      <h3 style="color: #374151; font-size: 16px;">Transaksi Terakhir</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">`;
    data.recentTransactions.forEach((t) => {
      const typeLabel = t.type === "income" ? "Masuk" : "Keluar";
      const typeColor = t.type === "income" ? "#059669" : "#dc2626";
      html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 0;"><span style="color: ${typeColor}; font-size: 12px; font-weight: 600;">${typeLabel}</span></td>
          <td style="padding: 8px 0; color: #4b5563;">${t.category}</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(t.amount)}</td>
          <td style="padding: 8px 0; text-align: right; color: #9ca3af; font-size: 12px;">${formatDate(t.date)}</td>
        </tr>`;
    });
    html += `</table>`;
  }

  html += `
      <hr style="border: 1px solid #fce7f3; margin-top: 20px;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
        Dikirim oleh WeWallet
      </p>
    </div>`;

  return html;
}
