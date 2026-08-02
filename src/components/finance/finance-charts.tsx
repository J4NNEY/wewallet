"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PieChart, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { FinanceRecord } from "@/types";

interface FinanceChartsProps {
  records: FinanceRecord[];
}

const COLORS = [
  "#ffb6c9", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#10b981", "#84cc16",
  "#6b7280",
];

export function FinanceCharts({ records }: FinanceChartsProps) {
  // Pie chart data - expenses by category
  const expenseByCategory = useMemo(() => {
    const expenses = records.filter((r) => r.type === "expense");
    const categoryMap = new Map<string, number>();

    expenses.forEach((r) => {
      const current = categoryMap.get(r.category) || 0;
      categoryMap.set(r.category, current + r.amount);
    });

    const total = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  // Bar chart data - daily totals for the current period
  const dailyData = useMemo(() => {
    const dataMap = new Map<string, { income: number; expense: number }>();

    records.forEach((r) => {
      const date = r.transaction_date;
      const current = dataMap.get(date) || { income: 0, expense: 0 };

      if (r.type === "income") {
        current.income += r.amount;
      } else {
        current.expense += r.amount;
      }

      dataMap.set(date, current);
    });

    return Array.from(dataMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [records]);

  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const maxDailyValue = Math.max(
    ...dailyData.map((d) => Math.max(d.income, d.expense)),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart - Expense by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseByCategory.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="Belum ada data pengeluaran"
              description="Pengeluaran per kategori akan tampil di sini."
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {/* Simple visual pie representation */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {expenseByCategory.reduce(
                      (acc, item, index) => {
                        const percentage = totalExpense > 0
                          ? (item.value / totalExpense) * 100
                          : 0;
                        const offset = acc.offset;
                        const dasharray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;

                        acc.elements.push(
                          <circle
                            key={item.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth="20"
                            strokeDasharray={dasharray}
                            strokeDashoffset={-offset}
                          />
                        );

                        acc.offset += percentage * 2.51327;
                        return acc;
                      },
                      { elements: [] as React.ReactNode[], offset: 0 }
                    ).elements}
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {expenseByCategory.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{item.percentage}%</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart - Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tren Harian</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum ada data transaksi"
              description="Tren harian akan muncul setelah ada transaksi."
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#ffb6c9]" />
                  <span className="text-gray-600">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-gray-600">Pengeluaran</span>
                </div>
              </div>

              <div className="flex items-end gap-2 h-48">
                {dailyData.map((day, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex gap-0.5 items-end justify-center h-40">
                      <div
                        className="flex-1 bg-[#ffb6c9] rounded-t"
                        style={{
                          height: `${(day.income / maxDailyValue) * 100}%`,
                          minHeight: day.income > 0 ? "4px" : "0",
                        }}
                      />
                      <div
                        className="flex-1 bg-red-400 rounded-t"
                        style={{
                          height: `${(day.expense / maxDailyValue) * 100}%`,
                          minHeight: day.expense > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 truncate w-full text-center">
                      {day.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
