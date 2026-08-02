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
  hero?: boolean;
}

const colorStyles = {
  green: { bg: "bg-emerald-50", icon: "text-emerald-500" },
  red: { bg: "bg-red-50", icon: "text-red-500" },
  pink: { bg: "bg-[#fff0f4]", icon: "text-[#e85d8a]" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500" },
};

export function StatsCard({ title, value, icon, trend, color, hero }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "hover:shadow-lift transition-all duration-200 h-full",
        hero && "bg-gradient-pink border-transparent"
      )}
    >
      <CardContent className={cn("p-3 sm:p-5", hero && "relative overflow-hidden")}>
        {hero && (
          <div
            aria-hidden="true"
            className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/25"
          />
        )}
        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs sm:text-sm font-medium",
                hero ? "text-white/90" : "text-gray-500"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-lg sm:text-2xl font-bold mt-1 sm:mt-2 truncate",
                hero ? "text-white" : "text-gray-900"
              )}
            >
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                {trend.isPositive ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                      hero ? "bg-white/25 text-white" : "text-emerald-600 bg-emerald-50"
                    )}
                  >
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    +{trend.value}%
                  </span>
                ) : trend.value === 0 ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100">
                    <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    0%
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium",
                      hero ? "bg-white/25 text-white" : "text-red-600 bg-red-50"
                    )}
                  >
                    <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {trend.value}%
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0",
              hero ? "bg-white/25" : styles.bg
            )}
          >
            <div className={cn(hero && "text-white")}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
