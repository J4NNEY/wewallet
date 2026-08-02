interface AuthErrorLike {
  message?: string;
  msg?: string;
  code?: string;
  error_code?: string;
  status?: number;
}

function pickMessage(err: unknown): string | null {
  if (typeof err === "string") return err;
  if (!err || typeof err !== "object") return null;
  const e = err as AuthErrorLike;
  if (typeof e.message === "string" && e.message && e.message !== "{}") return e.message;
  if (typeof e.msg === "string" && e.msg) return e.msg;
  return null;
}

function messageForCode(code: string | undefined, email: string): string {
  switch (code) {
    case "user_already_exists":
      return "Email ini sudah terdaftar. Coba masuk atau pakai email lain.";
    case "email_not_confirmed":
      return `Email ${email} belum diverifikasi. Cek inbox kamu atau kirim ulang email verifikasi.`;
    case "over_email_send_rate_limit":
      return "Terlalu banyak email dikirim dalam waktu singkat. Tunggu sebentar ya.";
    case "unexpected_failure":
      return "Gagal mengirim email verifikasi. Cek konfigurasi SMTP di dashboard Supabase, lalu coba lagi.";
    default:
      return "Gagal mengirim email verifikasi. Pastikan email kamu benar, lalu coba lagi.";
  }
}

export function getAuthErrorMessage(error: unknown, email?: string): string {
  const raw = pickMessage(error);
  const code =
    (error as AuthErrorLike)?.code ?? (error as AuthErrorLike)?.error_code;
  const isEmailSendFailure = !raw || raw === "{}";

  if (isEmailSendFailure) {
    return messageForCode(code, email ?? "");
  }

  if (code && raw.includes(code)) {
    return messageForCode(code, email ?? "");
  }

  return raw;
}
