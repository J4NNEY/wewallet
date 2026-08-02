"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Calculator,
  StickyNote,
  ShoppingCart,
  Bell,
  DollarSign,
} from "lucide-react";

const features = [
  { icon: Calculator, title: "Kalkulator", description: "Hitung cepat, riwayat tersimpan otomatis." },
  { icon: StickyNote, title: "Catatan", description: "Simpan ide & rekap penting kamu." },
  { icon: ShoppingCart, title: "Daftar Belanja", description: "Belanja bulanan jadi lebih teratur." },
  { icon: Bell, title: "Reminder", description: "Semua jadwal teringat tanpa takut lupa." },
  { icon: DollarSign, title: "Keuangan", description: "Pantau pemasukan & pengeluaran harian." },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffb6c9]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-0 h-96 w-96 rounded-full bg-[#ffb6c9]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-[#ffd6e2]/25 blur-3xl"
      />

      <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-pink flex items-center justify-center shadow-card">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-semibold text-gray-900">WeWallet</span>
          </div>

          <h1 className="mt-8 text-3xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Semua keperluan harianmu,{" "}
            <span className="text-gradient-pink">jadi satu</span>
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            Kalkulator, catatan, daftar belanja, reminder, dan catatan keuangan
            dalam satu aplikasi sederhana yang nyaman dipakai setiap hari.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg">Mulai Gratis</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Masuk
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/70 backdrop-blur rounded-2xl border border-[#ffe4ec] p-5 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff0f4] flex items-center justify-center mb-3">
                <feature.icon className="h-5 w-5 text-[#e85d8a]" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
