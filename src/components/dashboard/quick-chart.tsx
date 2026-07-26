"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface ChartDataPoint {
  day: string;
  income: number;
  expense: number;
}

interface QuickChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

export function QuickChart({ data, loading }: QuickChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Grafik Keuangan</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-gray-500">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-gray-500">Pengeluaran</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-48 flex items-end justify-between gap-2 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-1 space-y-1">
                <div className="h-32 bg-gray-100 rounded-t" />
                <div className="h-3 bg-gray-100 rounded w-8 mx-auto" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Belum ada data</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Chart area */}
            <div className="h-48 flex items-end justify-between gap-1.5 px-1">
              {data.map((point, index) => {
                const incomeHeight = (point.income / maxValue) * 100;
                const expenseHeight = (point.expense / maxValue) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: "160px" }}>
                      <div
                        className="flex-1 bg-pink-500 rounded-t-sm transition-all duration-300 hover:bg-pink-600"
                        style={{ height: `${incomeHeight}%`, minHeight: point.income > 0 ? "4px" : "0" }}
                      />
                      <div
                        className="flex-1 bg-gray-300 rounded-t-sm transition-all duration-300 hover:bg-gray-400"
                        style={{ height: `${expenseHeight}%`, minHeight: point.expense > 0 ? "4px" : "0" }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {point.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Pemasukan</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(data.reduce((sum, d) => sum + d.income, 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Pengeluaran</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(data.reduce((sum, d) => sum + d.expense, 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
