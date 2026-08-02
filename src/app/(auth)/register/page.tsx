"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${siteUrl}/login`,
      },
    });

    if (error) {
      setError(getAuthErrorMessage(error, email));
      setIsLoading(false);
      return;
    }

    setSuccess("Akun dibuat! Cek email buat verifikasi ya.");
    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
      },
    });

    setIsResending(false);
    if (error) {
      setError(getAuthErrorMessage(error, email));
    } else {
      setSuccess("Email verifikasi dikirim ulang. Cek inbox kamu ya!");
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Daftar</CardTitle>
        <CardDescription>
          Buat akun baru untuk mulai pakai WeWallet
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100 space-y-2">
              <p>{success}</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[#e85d8a] hover:text-[#d14b7a] font-medium disabled:opacity-50"
              >
                {isResending ? "Mengirim ulang..." : "Kirim ulang email verifikasi"}
              </button>
            </div>
          )}
          <Input
            label="Nama Lengkap"
            type="text"
            placeholder="Masukkan nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Masukkan ulang password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Daftar
          </Button>
          <p className="text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#e85d8a] hover:text-[#e85d8a] font-medium">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

