"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, DollarSign, ShoppingCart, Bell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export type ActivityType = "note" | "income" | "expense" | "shopping" | "reminder";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  timeAgo: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const activityConfig = {
  note: {
    icon: StickyNote,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  income: {
    icon: DollarSign,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  expense: {
    icon: DollarSign,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  shopping: {
    icon: ShoppingCart,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  reminder: {
    icon: Bell,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
};

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Aktivitas</CardTitle>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Belum ada aktivitas"
            description="Aktivitas terakhir kamu akan muncul di sini."
            className="min-h-48"
          />
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {activity.timeAgo}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
