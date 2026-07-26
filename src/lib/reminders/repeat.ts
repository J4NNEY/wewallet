import { createClient } from "@/lib/supabase/client";

type RepeatType = "none" | "daily" | "weekly" | "monthly";

interface ReminderToRepeat {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string;
  repeat_type: RepeatType;
}

/**
 * Calculate the next due date based on repeat type
 */
export function getNextDueDate(currentDueDate: string, repeatType: RepeatType): Date {
  const date = new Date(currentDueDate);

  switch (repeatType) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      break;
  }

  return date;
}

/**
 * Create the next recurring reminder when one is completed
 */
export async function createNextRecurringReminder(completedReminder: ReminderToRepeat): Promise<boolean> {
  if (completedReminder.repeat_type === "none") {
    return false;
  }

  const supabase = createClient();
  const nextDueDate = getNextDueDate(completedReminder.due_date, completedReminder.repeat_type);

  // Don't create if next date is more than 1 year in the future
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (nextDueDate > oneYearFromNow) {
    return false;
  }

  const { error } = await supabase.from("reminders").insert({
    user_id: completedReminder.user_id,
    title: completedReminder.title,
    description: completedReminder.description,
    due_date: nextDueDate.toISOString(),
    repeat_type: completedReminder.repeat_type,
    is_completed: false,
  });

  if (error) {
    console.error("Error creating recurring reminder:", error);
    return false;
  }

  return true;
}

/**
 * Get upcoming reminders for in-app notification
 */
export async function getUpcomingReminders(userId: string, hoursAhead: number = 24) {
  const supabase = createClient();
  const now = new Date();
  const ahead = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .gte("due_date", now.toISOString())
    .lte("due_date", ahead.toISOString())
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming reminders:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if a reminder is due today
 */
export function isDueToday(dueDate: string): boolean {
  const today = new Date();
  const due = new Date(dueDate);

  return (
    due.getDate() === today.getDate() &&
    due.getMonth() === today.getMonth() &&
    due.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a reminder is overdue
 */
export function isOverdue(dueDate: string): boolean {
  const now = new Date();
  const due = new Date(dueDate);
  return due < now;
}

/**
 * Format relative time (e.g., "2 jam lagi", "Besok")
 */
export function formatRelativeTime(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return "Terlewat";
  }

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} menit lagi`;
  }

  if (diffHours < 24) {
    return `${diffHours} jam lagi`;
  }

  if (diffDays === 1) {
    return "Besok";
  }

  if (diffDays < 7) {
    return `${diffDays} hari lagi`;
  }

  return due.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
  });
}
