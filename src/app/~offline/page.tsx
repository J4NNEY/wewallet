"use client";

import { WifiOff, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fef7f9] p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-pink shadow-card">
          <WifiOff className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Kamu lagi offline</h1>
        <p className="mt-1 text-sm text-gray-500">
          Periksa koneksi internet kamu lalu coba lagi ya.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ffb6c9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff9db5]"
        >
          <RotateCcw className="h-4 w-4" />
          Coba lagi
        </button>
      </div>
    </main>
  );
}
