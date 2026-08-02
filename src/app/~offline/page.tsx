"use client";

import { WifiOff, RotateCcw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-pink shadow-card">
          <WifiOff className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-on-surface">Kamu lagi offline</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Periksa koneksi internet kamu lalu coba lagi ya.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          <RotateCcw className="h-4 w-4" />
          Coba lagi
        </button>
      </div>
    </main>
  );
}
