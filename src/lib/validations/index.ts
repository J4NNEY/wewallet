import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

// Profile schema
export const profileSchema = z.object({
  fullName: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

// Notes schema
export const noteSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Judul terlalu panjang"),
  content: z.string().max(10000, "Konten terlalu panjang").optional(),
  category: z.string().optional(),
});

// Shopping schemas
export const shoppingListSchema = z.object({
  name: z.string().min(1, "Nama daftar wajib diisi").max(100, "Nama terlalu panjang"),
});

export const shoppingItemSchema = z.object({
  item_name: z.string().min(1, "Nama barang wajib diisi").max(100, "Nama terlalu panjang"),
  quantity: z.number().min(1, "Jumlah minimal 1").max(9999, "Jumlah terlalu besar"),
  unit: z.string().max(20, "Satuan terlalu panjang").optional(),
  estimated_price: z.number().min(0, "Harga tidak boleh negatif").max(999999999, "Harga terlalu besar"),
});

// Reminder schema
export const reminderSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Judul terlalu panjang"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  due_date: z.string().min(1, "Tanggal wajib diisi"),
  due_time: z.string().min(1, "Waktu wajib diisi"),
  repeat_type: z.enum(["none", "daily", "weekly", "monthly"]),
});

// Finance schema
export const financeRecordSchema = z.object({
  type: z.enum(["income", "expense"], { message: "Tipe wajib dipilih" }),
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z.number().min(1, "Jumlah minimal 1").max(999999999, "Jumlah terlalu besar"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  transaction_date: z.string().min(1, "Tanggal wajib diisi"),
});

// Calculator schema
export const calculatorSaveSchema = z.object({
  expression: z.string().min(1, "Ekspresi wajib diisi"),
  result: z.number(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ShoppingListInput = z.infer<typeof shoppingListSchema>;
export type ShoppingItemInput = z.infer<typeof shoppingItemSchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type FinanceRecordInput = z.infer<typeof financeRecordSchema>;
