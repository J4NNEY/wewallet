"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { User, Lock } from "lucide-react";
import { profileSchema, changePasswordSchema } from "@/lib/validations";

export default function ProfilePage() {
  const { success, error: showError } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = profileSchema.safeParse({ fullName });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: result.data.fullName },
      });

      if (error) throw error;
      success("Profil berhasil diperbarui!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showError("Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = changePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setChangingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: result.data.newPassword,
      });

      if (error) throw error;
      
      setNewPassword("");
      setConfirmPassword("");
      success("Password berhasil diubah!");
    } catch (err) {
      console.error("Error changing password:", err);
      showError("Gagal mengubah password.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Profil</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola akun kamu</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <User className="h-5 w-5 text-[#e85d8a]" />
            </div>
            <div>
              <CardTitle className="text-base">Informasi Profil</CardTitle>
              <CardDescription className="text-sm">Ubah nama kamu</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleUpdateProfile}>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Nama Lengkap"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (profileErrors.fullName) setProfileErrors({});
              }}
              placeholder="Masukkan nama kamu"
              error={profileErrors.fullName}
            />
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" isLoading={saving}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Lock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-base">Ubah Password</CardTitle>
              <CardDescription className="text-sm">Ganti password kamu</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleChangePassword}>
          <CardContent className="space-y-4">
            <Input
              label="Password Baru"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordErrors.newPassword) setPasswordErrors({});
              }}
              placeholder="Minimal 6 karakter"
              error={passwordErrors.newPassword}
            />
            <Input
              label="Konfirmasi Password Baru"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordErrors.confirmPassword) setPasswordErrors({});
              }}
              placeholder="Masukkan ulang password"
              error={passwordErrors.confirmPassword}
            />
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" variant="outline" isLoading={changingPassword}>
              Ubah Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

