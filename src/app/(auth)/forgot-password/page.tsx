"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(getAuthErrorMessage(error, email));
      setIsLoading(false);
      return;
    }

    setSuccess("Email reset sudah dikirim. Cek inbox kamu!");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Lupa Password</CardTitle>
        <CardDescription>
          Ketik email kamu, nanti dikirim link reset
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleResetPassword}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100">
              {success}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Kirim Link Reset
          </Button>
          <p className="text-sm text-gray-500">
            Kembali ke{" "}
            <Link href="/login" className="text-[#e85d8a] hover:text-[#e85d8a] font-medium">
              halaman login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

