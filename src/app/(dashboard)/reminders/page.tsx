"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Bell,
  Trash2,
  Edit,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { reminderSchema } from "@/lib/validations";
import { createNextRecurringReminder } from "@/lib/reminders/repeat";
import type { Reminder } from "@/types";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const REPEAT_OPTIONS = [
  { value: "none", label: "Tidak berulang" },
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
];

export default function RemindersPage() {
  const { success, error: showError } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "09:00",
    repeat_type: "none" as Reminder["repeat_type"],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchReminders = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (!error && data) {
      setReminders(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getRemindersForDate = (date: Date) => {
    return reminders.filter((r) => {
      const reminderDate = new Date(r.due_date);
      return (
        reminderDate.getDate() === date.getDate() &&
        reminderDate.getMonth() === date.getMonth() &&
        reminderDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setFormData((prev) => ({
      ...prev,
      due_date: date.toISOString().split("T")[0],
    }));
    setShowCreateModal(true);
  };

  const handleCreateOrUpdate = async () => {
    const result = reminderSchema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dueDate = new Date(`${result.data.due_date}T${result.data.due_time}:00`);

    try {
      if (editingReminder) {
        const { error } = await supabase
          .from("reminders")
          .update({
            title: result.data.title.trim(),
            description: result.data.description || null,
            due_date: dueDate.toISOString(),
            repeat_type: result.data.repeat_type,
          })
          .eq("id", editingReminder.id);

        if (error) throw error;
        success("Reminder berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("reminders").insert({
          user_id: user.id,
          title: result.data.title.trim(),
          description: result.data.description || null,
          due_date: dueDate.toISOString(),
          repeat_type: result.data.repeat_type,
        });

        if (error) throw error;
        success("Reminder berhasil dibuat!");
      }

      resetForm();
      fetchReminders();
    } catch (err) {
      console.error("Error saving reminder:", err);
      showError("Gagal menyimpan reminder. Coba lagi.");
    }
  };

  const handleEdit = (reminder: Reminder) => {
    const dueDate = new Date(reminder.due_date);
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      due_date: dueDate.toISOString().split("T")[0],
      due_time: dueDate.toTimeString().slice(0, 5),
      repeat_type: reminder.repeat_type,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus reminder ini?")) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
      success("Reminder berhasil dihapus!");
      fetchReminders();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      showError("Gagal menghapus reminder.");
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      const supabase = createClient();
      const newCompletedState = !reminder.is_completed;
      
      const { error } = await supabase
        .from("reminders")
        .update({ is_completed: newCompletedState })
        .eq("id", reminder.id);

      if (error) throw error;

      // If marking as completed and has repeat type, create next reminder
      if (newCompletedState && reminder.repeat_type !== "none") {
        const created = await createNextRecurringReminder({
          id: reminder.id,
          user_id: reminder.user_id,
          title: reminder.title,
          description: reminder.description,
          due_date: reminder.due_date,
          repeat_type: reminder.repeat_type,
        });

        if (created) {
          success("Reminder selesai! Reminder berikutnya sudah dibuat.");
        } else {
          success("Reminder selesai!");
        }
      } else {
        success(newCompletedState ? "Reminder selesai!" : "Reminder dibatalkan.");
      }

      fetchReminders();
    } catch (err) {
      console.error("Error toggling reminder:", err);
      showError("Gagal mengupdate status.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      due_time: "09:00",
      repeat_type: "none",
    });
    setEditingReminder(null);
    setShowCreateModal(false);
    setValidationErrors({});
  };

  const upcomingReminders = reminders
    .filter((r) => !r.is_completed && new Date(r.due_date) >= new Date())
    .slice(0, 10);

  const completedReminders = reminders.filter((r) => r.is_completed);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayReminders = getRemindersForDate(date);
      const isToday =
        new Date().toDateString() === date.toDateString();
      const isSelected =
        selectedDate?.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer transition-colors ${
            isToday ? "bg-[#fff0f4]" : "hover:bg-gray-50"
          } ${isSelected ? "ring-2 ring-[#ffb6c9]" : ""}`}
          onClick={() => handleDateClick(day)}
        >
          <div
            className={`text-sm font-medium ${
              isToday
                ? "text-[#e85d8a]"
                : "text-gray-700"
            }`}
          >
            {day}
          </div>
          <div className="mt-1 space-y-0.5 overflow-hidden max-h-16">
            {dayReminders.slice(0, 2).map((r) => (
              <div
                key={r.id}
                className={`text-xs truncate px-1 py-0.5 rounded ${
                  r.is_completed
                    ? "bg-gray-100 text-gray-400 line-through"
                    : "bg-pink-100 text-pink-700"
                }`}
              >
                {r.title}
              </div>
            ))}
            {dayReminders.length > 2 && (
              <div className="text-xs text-gray-400">
                +{dayReminders.length - 2} lagi
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reminder</h1>
          <p className="text-sm text-gray-600">Pengingat kamu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Kalender
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <Clock className="h-4 w-4 mr-1" />
            Daftar
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Baru
          </Button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={resetForm}
        title={editingReminder ? "Edit Reminder" : "Buat Reminder"}
      >
        <div className="space-y-4">
          <Input
            label="Judul"
            placeholder="Contoh: Meeting dengan klien"
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              if (validationErrors.title) setValidationErrors({});
            }}
            error={validationErrors.title}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e85d8a]"
              placeholder="Detail tambahan..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tanggal"
              type="date"
              value={formData.due_date}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, due_date: e.target.value }));
                if (validationErrors.due_date) setValidationErrors({});
              }}
              error={validationErrors.due_date}
            />
            <Input
              label="Waktu"
              type="time"
              value={formData.due_time}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, due_time: e.target.value }));
                if (validationErrors.due_time) setValidationErrors({});
              }}
              error={validationErrors.due_time}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pengulangan
            </label>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={formData.repeat_type === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, repeat_type: opt.value as Reminder["repeat_type"] }))
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Batal
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingReminder ? "Simpan" : "Buat"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Calendar View */}
      {view === "calendar" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[490px]">
                <div className="grid grid-cols-7 gap-0">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs sm:text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mendatang</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Memuat...
                </p>
              ) : upcomingReminders.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Tidak ada reminder mendatang
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReminders.map((reminder) => (
                    <ReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggleComplete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selesai</CardTitle>
            </CardHeader>
            <CardContent>
              {completedReminders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Belum ada yang selesai
                </p>
              ) : (
                <div className="space-y-2">
                  {completedReminders.map((reminder) => (
                    <ReminderItem
                      key={reminder.id}
                      reminder={reminder}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggleComplete}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReminderItem({
  reminder,
  onEdit,
  onDelete,
  onToggle,
}: {
  reminder: Reminder;
  onEdit: (r: Reminder) => void;
  onDelete: (id: string) => void;
  onToggle: (r: Reminder) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        reminder.is_completed
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200"
      }`}
    >
      <button
        onClick={() => onToggle(reminder)}
        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center ${
          reminder.is_completed
            ? "bg-[#ffb6c9] border-[#ffb6c9]"
            : "border-gray-300"
        }`}
      >
        {reminder.is_completed && <Check className="h-3 w-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`font-medium ${
            reminder.is_completed
              ? "line-through text-gray-400"
              : "text-gray-900"
          }`}
        >
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {reminder.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-400">
            {formatDateTime(reminder.due_date)}
          </p>
          {reminder.repeat_type !== "none" && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {reminder.repeat_type === "daily" && "Harian"}
              {reminder.repeat_type === "weekly" && "Mingguan"}
              {reminder.repeat_type === "monthly" && "Bulanan"}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(reminder)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500"
          onClick={() => onDelete(reminder.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


