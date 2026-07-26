"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "green" | "red" | "pink" | "blue" | "purple";
}

const colorStyles = {
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-600 bg-red-50",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-600 bg-red-50",
  },
  pink: {
    bg: "bg-pink-50",
    icon: "text-pink-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-600 bg-red-50",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-600 bg-red-50",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    trendUp: "text-emerald-600 bg-emerald-50",
    trendDown: "text-red-600 bg-red-50",
  },
};

export function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 h-full">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 mt-1 sm:mt-2 truncate">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                {trend.isPositive ? (
                  <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium", styles.trendUp)}>
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    +{trend.value}%
                  </div>
                ) : trend.value === 0 ? (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100">
                    <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    0%
                  </div>
                ) : (
                  <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium", styles.trendDown)}>
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {trend.value}%
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={cn("w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0", styles.bg)}>
            <div className={styles.icon}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
