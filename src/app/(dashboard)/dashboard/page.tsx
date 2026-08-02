"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Calculator, 
  StickyNote, 
  ShoppingCart, 
  Bell, 
  DollarSign,
  ArrowDownRight,
  Eye,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ModuleCard,
  ActivityFeed,
  QuickChart,
  UpcomingReminders,
  QuickActions,
} from "@/components/dashboard";
import type { Activity, UpcomingReminder } from "@/components/dashboard";

export default function DashboardPage() {
  const [userName, setUserName] = useState("Pengguna");
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [notesCount, setNotesCount] = useState(0);
  const [calcCount, setCalcCount] = useState(0);
  const [shoppingCount, setShoppingCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [lastMonthExpense, setLastMonthExpense] = useState(0);
  
  // Last activities
  const [lastNote, setLastNote] = useState<string | undefined>(undefined);
  const [lastTransaction, setLastTransaction] = useState<string | undefined>(undefined);
  
  // Chart data
  const [chartData, setChartData] = useState<Array<{ day: string; income: number; expense: number }>>([]);
  
  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Upcoming reminders
  const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);

  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        // Date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Last 7 days for chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split("T")[0];
        });

        // Fetch all data in parallel
        const [
          notesRes,
          calcRes,
          shoppingRes,
          reminderRes,
          financeRes,
          lastFinanceRes,
          recentNotesRes,
          recentFinanceRes,
          recentShoppingRes,
          recentRemindersRes,
          upcomingRes,
          chartFinanceRes,
        ] = await Promise.all([
          // Counts
          supabase.from("notes").select("id", { count: "exact", head: true }),
          supabase.from("calculator_history").select("id", { count: "exact", head: true }),
          supabase.from("shopping_lists").select("id", { count: "exact", head: true }).eq("is_completed", false),
          supabase.from("reminders").select("id", { count: "exact", head: true }).eq("is_completed", false),
          
          // Current month finance
          supabase.from("finance_records")
            .select("type, amount")
            .gte("transaction_date", startOfMonth.toISOString().split("T")[0]),
          
          // Last month finance (for trend)
          supabase.from("finance_records")
            .select("type, amount")
            .gte("transaction_date", startOfLastMonth.toISOString().split("T")[0])
            .lte("transaction_date", endOfLastMonth.toISOString().split("T")[0]),
          
          // Recent notes
          supabase.from("notes")
            .select("title, created_at")
            .order("created_at", { ascending: false })
            .limit(1),
          
          // Recent finance
          supabase.from("finance_records")
            .select("type, category, amount, created_at")
            .order("created_at", { ascending: false })
            .limit(1),
          
          // Recent shopping
          supabase.from("shopping_list_items")
            .select("item_name, is_checked, created_at")
            .order("created_at", { ascending: false })
            .limit(1),
          
          // Recent reminders
          supabase.from("reminders")
            .select("title, is_completed, created_at")
            .order("created_at", { ascending: false })
            .limit(1),
          
          // Upcoming reminders
          supabase.from("reminders")
            .select("id, title, due_date")
            .eq("is_completed", false)
            .gte("due_date", now.toISOString())
            .order("due_date", { ascending: true })
            .limit(5),
          
          // Chart data (last 7 days)
          supabase.from("finance_records")
            .select("type, amount, transaction_date")
            .gte("transaction_date", last7Days[0])
            .lte("transaction_date", last7Days[6]),
        ]);

        // Process counts
        setNotesCount(notesRes.count ?? 0);
        setCalcCount(calcRes.count ?? 0);
        setShoppingCount(shoppingRes.count ?? 0);
        setReminderCount(reminderRes.count ?? 0);

        // Process finance
        if (financeRes.data) {
          const income = financeRes.data
            .filter((r) => r.type === "income")
            .reduce((sum, r) => sum + r.amount, 0);
          const expense = financeRes.data
            .filter((r) => r.type === "expense")
            .reduce((sum, r) => sum + r.amount, 0);
          setMonthlyIncome(income);
          setMonthlyExpense(expense);
        }

        // Process last month finance for trend
        if (lastFinanceRes.data) {
          const lastIncome = lastFinanceRes.data
            .filter((r) => r.type === "income")
            .reduce((sum, r) => sum + r.amount, 0);
          const lastExpense = lastFinanceRes.data
            .filter((r) => r.type === "expense")
            .reduce((sum, r) => sum + r.amount, 0);
          setLastMonthIncome(lastIncome);
          setLastMonthExpense(lastExpense);
        }

        // Process last activities
        if (recentNotesRes.data?.[0]) {
          setLastNote(`Terakhir: "${recentNotesRes.data[0].title}"`);
        }
        if (recentFinanceRes.data?.[0]) {
          const t = recentFinanceRes.data[0];
          setLastTransaction(`${t.type === "income" ? "Pemasukan" : "Pengeluaran"} ${t.category}`);
        }

        // Process chart data
        if (chartFinanceRes.data) {
          const chartMap = new Map(last7Days.map(d => [d, { income: 0, expense: 0 }]));
          chartFinanceRes.data.forEach((record) => {
            const existing = chartMap.get(record.transaction_date) || { income: 0, expense: 0 };
            if (record.type === "income") {
              existing.income += record.amount;
            } else {
              existing.expense += record.amount;
            }
            chartMap.set(record.transaction_date, existing);
          });
          
          const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          setChartData(
            last7Days.map((date) => {
              const d = new Date(date);
              const data = chartMap.get(date) || { income: 0, expense: 0 };
              return {
                day: dayNames[d.getDay()],
                ...data,
              };
            })
          );
        }

        // Process activities
        const allActivities: Activity[] = [];
        
        const getTimeAgo = (dateStr: string) => {
          const date = new Date(dateStr);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          if (diffMins < 1) return "Baru saja";
          if (diffMins < 60) return `${diffMins}m lalu`;
          if (diffHours < 24) return `${diffHours}j lalu`;
          if (diffDays < 7) return `${diffDays}h lalu`;
          return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        };

        if (recentNotesRes.data?.[0]) {
          allActivities.push({
            id: "note-1",
            type: "note",
            title: `Note: "${recentNotesRes.data[0].title}"`,
            description: "Catatan baru ditambahkan",
            timestamp: recentNotesRes.data[0].created_at,
            timeAgo: getTimeAgo(recentNotesRes.data[0].created_at),
          });
        }
        if (recentFinanceRes.data?.[0]) {
          const t = recentFinanceRes.data[0];
          allActivities.push({
            id: "finance-1",
            type: t.type === "income" ? "income" : "expense",
            title: `${t.type === "income" ? "Pemasukan" : "Pengeluaran"} ${t.category}`,
            description: formatCurrency(t.amount),
            timestamp: t.created_at,
            timeAgo: getTimeAgo(t.created_at),
          });
        }
        if (recentShoppingRes.data?.[0]) {
          allActivities.push({
            id: "shopping-1",
            type: "shopping",
            title: `Belanja: ${recentShoppingRes.data[0].item_name}`,
            description: recentShoppingRes.data[0].is_checked ? "Sudah dibeli" : "Belum dibeli",
            timestamp: recentShoppingRes.data[0].created_at,
            timeAgo: getTimeAgo(recentShoppingRes.data[0].created_at),
          });
        }
        if (recentRemindersRes.data?.[0]) {
          allActivities.push({
            id: "reminder-1",
            type: "reminder",
            title: `Reminder: ${recentRemindersRes.data[0].title}`,
            description: recentRemindersRes.data[0].is_completed ? "Selesai" : "Aktif",
            timestamp: recentRemindersRes.data[0].created_at,
            timeAgo: getTimeAgo(recentRemindersRes.data[0].created_at),
          });
        }
        
        allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(allActivities.slice(0, 5));

        // Process upcoming reminders
        if (upcomingRes.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          setUpcomingReminders(
            upcomingRes.data.map((r) => {
              const dueDate = new Date(r.due_date);
              dueDate.setHours(0, 0, 0, 0);
              
              return {
                id: r.id,
                title: r.title,
                dueDate: dueDate.toLocaleDateString("id-ID", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long" 
                }),
                dueTime: new Date(r.due_date).toLocaleTimeString("id-ID", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                }),
                isToday: dueDate.getTime() === today.getTime(),
                isTomorrow: dueDate.getTime() === tomorrow.getTime(),
              };
            })
          );
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate trends (comparing to last month)
  const incomeTrend = lastMonthIncome > 0 
    ? Math.round(((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100) 
    : monthlyIncome > 0 ? 100 : 0;
  const expenseTrend = lastMonthExpense > 0 
    ? Math.round(((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100) 
    : monthlyExpense > 0 ? 100 : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const firstName = userName.split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const balance = monthlyIncome - monthlyExpense;
  const formattedBalance = showBalance ? formatCurrency(balance) : "Rp ••••••";
  const formattedExpense = showBalance ? formatCurrency(monthlyExpense) : "Rp ••••••";

  const modules = [
    {
      name: "Kalkulator",
      description: "Hitung & riwayat",
      href: "/calculator",
      icon: Calculator,
      count: calcCount,
      label: "perhitungan",
      lastActivity: undefined,
      color: "blue" as const,
    },
    {
      name: "Catatan",
      description: "Catatan pribadi",
      href: "/notes",
      icon: StickyNote,
      count: notesCount,
      label: "catatan",
      lastActivity: lastNote,
      color: "purple" as const,
    },
    {
      name: "Belanja",
      description: "Daftar belanja",
      href: "/shopping",
      icon: ShoppingCart,
      count: shoppingCount,
      label: "aktif",
      lastActivity: undefined,
      color: "orange" as const,
    },
    {
      name: "Reminder",
      description: "Atur jadwal",
      href: "/reminders",
      icon: Bell,
      count: reminderCount,
      label: "mendatang",
      lastActivity: undefined,
      color: "pink" as const,
    },
    {
      name: "Keuangan",
      description: "Catatan keuangan",
      href: "/finance",
      icon: DollarSign,
      count: undefined,
      label: undefined,
      lastActivity: lastTransaction,
      color: "green" as const,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {getGreeting()},{" "}
            <span className="text-primary-text">{firstName}!</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{todayLabel}</p>
        </div>
        <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-primary-fixed items-center justify-center text-primary-text font-extrabold shadow-card">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Balance & Expense */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-pink shadow-lift">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/15"
          />
          <div
            aria-hidden="true"
            className="absolute right-24 -bottom-16 h-32 w-32 rounded-full bg-white/10"
          />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                Saldo
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 rounded-full hover:bg-white/15 transition-colors"
                aria-label={showBalance ? "Sembunyikan saldo" : "Tampilkan saldo"}
              >
                {showBalance ? (
                  <EyeOff className="h-4 w-4 text-white/80" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4 text-white/80" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
              {formattedBalance}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-medium text-white/85">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                +{Math.abs(incomeTrend)}%
              </span>
              <span>vs bulan lalu</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-primary-fixed p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container/60 text-error flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-on-surface-variant">
                Pengeluaran Bulan Ini
              </p>
              <p className="mt-0.5 text-xl sm:text-2xl font-extrabold text-on-surface tabular-nums truncate">
                {formattedExpense}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">
              {Math.abs(expenseTrend) === 0
                ? "Tidak ada perubahan"
                : expenseTrend > 0
                  ? "Naik dibanding bulan lalu"
                  : "Turun dibanding bulan lalu"}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${expenseTrend > 0 ? "text-error" : "text-secondary"}`}
            >
              {expenseTrend > 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {Math.abs(expenseTrend)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Chart */}
      <QuickChart data={chartData} loading={false} />

      {/* Module Cards - 2 columns on mobile */}
      <div>
        <h2 className="text-base font-bold text-on-surface mb-3">Modul</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.name}
              name={mod.name}
              description={mod.description}
              href={mod.href}
              icon={mod.icon}
              count={mod.count}
              label={mod.label}
              lastActivity={mod.lastActivity}
              color={mod.color}
            />
          ))}
        </div>
      </div>

      {/* Aktivitas & Reminder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeed activities={activities} loading={false} />
        <UpcomingReminders reminders={upcomingReminders} loading={false} />
      </div>
    </div>
  );
}
