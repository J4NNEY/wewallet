"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Calculator, 
  StickyNote, 
  ShoppingCart, 
  Bell, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  StatsCard,
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
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-200" />
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-xl" />
          <div className="h-80 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
          {getGreeting()}, {userName}!
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Ringkasan hari ini
        </p>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 scrollbar-hide">
        <div className="flex-shrink-0 w-[160px] sm:w-auto">
          <StatsCard
            title="Pemasukan"
            value={formatCurrency(monthlyIncome)}
            icon={<ArrowUpRight className="h-5 w-5" />}
            trend={{ value: Math.abs(incomeTrend), isPositive: incomeTrend >= 0 }}
            color="green"
          />
        </div>
        <div className="flex-shrink-0 w-[160px] sm:w-auto">
          <StatsCard
            title="Pengeluaran"
            value={formatCurrency(monthlyExpense)}
            icon={<ArrowDownRight className="h-5 w-5" />}
            trend={{ value: Math.abs(expenseTrend), isPositive: expenseTrend <= 0 }}
            color="red"
          />
        </div>
        <div className="flex-shrink-0 w-[160px] sm:w-auto">
          <StatsCard
            title="Saldo"
            value={formatCurrency(monthlyIncome - monthlyExpense)}
            icon={<DollarSign className="h-5 w-5" />}
            color="pink"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Chart */}
      <QuickChart data={chartData} loading={false} />

      {/* Module Cards - 2 columns on mobile */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Modul</h2>
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

      {/* Upcoming Reminders */}
      <UpcomingReminders reminders={upcomingReminders} loading={false} />
    </div>
  );
}
