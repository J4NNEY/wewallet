import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Note, ShoppingList, ShoppingListItem, FinanceRecord } from "@/types";

const downloadExcel = (workbook: XLSX.WorkBook, filename: string) => {
  XLSX.writeFile(workbook, filename);
};

export function exportNotesToExcel(notes: Note[]) {
  const data = notes.map((note, index) => ({
    No: index + 1,
    Judul: note.title,
    Kategori: note.category || "-",
    Dipin: note.is_pinned ? "Ya" : "Tidak",
    Isi: note.content || "-",
    Dibuat: formatDate(note.created_at),
    Diperbarui: formatDate(note.updated_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },  // No
    { wch: 30 }, // Judul
    { wch: 15 }, // Kategori
    { wch: 8 },  // Dipin
    { wch: 50 }, // Isi
    { wch: 20 }, // Dibuat
    { wch: 20 }, // Diperbarui
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Catatan");

  downloadExcel(workbook, "daftar-catatan.xlsx");
}

export function exportShoppingListToExcel(list: ShoppingList, items: ShoppingListItem[]) {
  const data = items.map((item, index) => ({
    No: index + 1,
    Barang: item.item_name,
    Jumlah: item.quantity,
    Satuan: item.unit || "pcs",
    "Harga Satuan": item.estimated_price || 0,
    Total: (item.estimated_price || 0) * (item.quantity || 1),
    Status: item.is_checked ? "Sudah Dibeli" : "Belum",
  }));

  // Add total row
  const totalEstimate = items.reduce(
    (sum, item) => sum + (item.estimated_price || 0) * (item.quantity || 1),
    0
  );

  data.push({
    No: 0,
    Barang: "TOTAL",
    Jumlah: 0,
    Satuan: "",
    "Harga Satuan": 0,
    Total: totalEstimate,
    Status: "",
  } as any);

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },  // No
    { wch: 25 }, // Barang
    { wch: 10 }, // Jumlah
    { wch: 10 }, // Satuan
    { wch: 15 }, // Harga Satuan
    { wch: 15 }, // Total
    { wch: 15 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Belanja");

  downloadExcel(workbook, `belanja-${list.name.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}

export function exportFinanceToExcel(records: FinanceRecord[], period: string) {
  const totalIncome = records
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalIncome - totalExpense;

  // Summary data
  const summaryData = [
    { Ringkasan: "Pemasukan", Jumlah: totalIncome },
    { Ringkasan: "Pengeluaran", Jumlah: totalExpense },
    { Ringkasan: "Saldo", Jumlah: balance },
    { Ringkasan: "", Jumlah: "" },
  ];

  // Transaction data
  const transactionData = records.map((record, index) => ({
    No: index + 1,
    Tanggal: formatDate(record.transaction_date),
    Tipe: record.type === "income" ? "Pemasukan" : "Pengeluaran",
    Kategori: record.category,
    Jumlah: record.amount,
    Keterangan: record.description || "-",
  }));

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet["!cols"] = [
    { wch: 15 },
    { wch: 20 },
  ];

  const transactionWorksheet = XLSX.utils.json_to_sheet(transactionData);
  transactionWorksheet["!cols"] = [
    { wch: 5 },  // No
    { wch: 20 }, // Tanggal
    { wch: 15 }, // Tipe
    { wch: 15 }, // Kategori
    { wch: 15 }, // Jumlah
    { wch: 30 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Ringkasan");
  XLSX.utils.book_append_sheet(workbook, transactionWorksheet, "Transaksi");

  downloadExcel(workbook, `laporan-keuangan-${period.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}
