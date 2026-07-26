import { Wallet } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pink-500 flex items-center justify-center">
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
