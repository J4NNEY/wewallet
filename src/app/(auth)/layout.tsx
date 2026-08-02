import { Wallet } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-hero relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#ffb6c9]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#ffd6e2]/30 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-pink flex items-center justify-center shadow-card">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-semibold text-gray-900">
            WeWallet
          </span>
        </Link>

        {/* Auth Card */}
        {children}
      </div>
    </div>
  );
}
