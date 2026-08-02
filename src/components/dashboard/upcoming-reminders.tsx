"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export interface UpcomingReminder {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  isToday: boolean;
  isTomorrow: boolean;
}

interface UpcomingRemindersProps {
  reminders: UpcomingReminder[];
  loading?: boolean;
}

export function UpcomingReminders({ reminders, loading }: UpcomingRemindersProps) {
  const getDateLabel = (reminder: UpcomingReminder) => {
    if (reminder.isToday) return "Hari ini";
    if (reminder.isTomorrow) return "Besok";
    return reminder.dueDate;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Jadwal Mendatang</CardTitle>
          <Bell className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Tidak ada reminder mendatang"
            description="Tenang aja, belum ada jadwal yang perlu dikejar."
            className="min-h-48"
          />
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50",
                  reminder.isToday ? "border-[#ffb6c9]/40 bg-[#fff0f4]" : "border-[#ffe4ec]"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  reminder.isToday ? "bg-[#ffb6c9]" : "bg-[#fff0f4]"
                )}>
                  <Clock className={cn(
                    "h-5 w-5",
                    reminder.isToday ? "text-white" : "text-[#d14b7a]"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {reminder.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-xs font-medium",
                      reminder.isToday ? "text-[#e85d8a]" : "text-gray-500"
                    )}>
                      {getDateLabel(reminder)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {reminder.dueTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

