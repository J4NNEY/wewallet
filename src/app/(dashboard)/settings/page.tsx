"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Mail, Send, Clock, Info } from "lucide-react";

type RecapFrequency = "off" | "weekly" | "monthly";

export default function SettingsPage() {
  const { success, error: showError } = useToast();
  const [frequency, setFrequency] = useState<RecapFrequency>("off");
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("recap_frequency");
    if (saved) setFrequency(saved as RecapFrequency);
    
    const savedLastSent = localStorage.getItem("recap_last_sent");
    if (savedLastSent) setLastSent(savedLastSent);

    const fetchUser = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    fetchUser();
  }, []);

  const handleSavePreference = (freq: RecapFrequency) => {
    setFrequency(freq);
    localStorage.setItem("recap_frequency", freq);
    success("Preferensi tersimpan!");
  };

  const handleSendRecap = async (period: "weekly" | "monthly") => {
    setSending(true);

    try {
      const response = await fetch("/api/send-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal mengirim rekap");

      const now = new Date().toLocaleString("id-ID");
      setLastSent(now);
      localStorage.setItem("recap_last_sent", now);

      success(data.message || `Rekap berhasil dikirim ke ${userEmail}!`);
    } catch (err) {
      console.error("Error sending recap:", err);
      showError(err instanceof Error ? err.message : "Gagal mengirim rekap. Coba lagi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola preferensi kamu</p>
      </div>

      {/* Email Recap Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[#e85d8a]" />
            </div>
            <div>
              <CardTitle className="text-base">Rekap Email</CardTitle>
              <CardDescription className="text-sm">
                Kirim rekap keuangan langsung ke email kamu
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Info */}
          {userEmail && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Email tujuan:</p>
              <p className="text-sm font-medium text-gray-900">{userEmail}</p>
            </div>
          )}

          {/* Frequency Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Frekuensi Rekap Otomatis
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "off" as const, label: "Nonaktif" },
                { value: "weekly" as const, label: "Mingguan" },
                { value: "monthly" as const, label: "Bulanan" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={frequency === option.value ? "default" : "outline"}
                  onClick={() => handleSavePreference(option.value)}
                  className="w-full"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {frequency !== "off" && (
              <p className="text-xs text-gray-500 mt-2">
                Rekap akan dikirim otomatis setiap {frequency === "weekly" ? "Senin pagi" : "tanggal 1"}.
              </p>
            )}
          </div>

          {/* Manual Send */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Kirim Rekap Sekarang
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleSendRecap("weekly")}
                isLoading={sending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Rekap Minggu Ini
              </Button>
              <Button
                onClick={() => handleSendRecap("monthly")}
                isLoading={sending}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Rekap Bulan Ini
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Email akan dikirim langsung ke {userEmail || "email kamu"}
            </p>
          </div>

          {/* Last Sent */}
          {lastSent && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              Terakhir dikirim: {lastSent}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="text-blue-500 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Tentang Rekap Email</p>
              <p className="text-xs text-blue-700 mt-1">
                Rekap akan dikirim langsung ke email yang terdaftar di akun kamu. 
                Pastikan kamu sudah verifikasi email agar bisa menerima rekap.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

