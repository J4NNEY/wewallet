import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Note, ShoppingList, ShoppingListItem, FinanceRecord } from "@/types";

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFontSize(20);
  doc.setTextColor(236, 72, 153); // pink-500
  doc.text("WeWallet", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(title, 14, 32);

  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(14, 36, 196, 36);

  return 44;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text(
      `Halaman ${i} dari ${pageCount} | Dicetak pada ${new Date().toLocaleDateString("id-ID")}`,
      14,
      286
    );
  }
};

export function exportNoteToPDF(note: Note) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Catatan");

  // Title
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(note.title, 14, y);
  y += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  if (note.category) {
    doc.text(`Kategori: ${note.category}`, 14, y);
    y += 6;
  }
  doc.text(`Dibuat: ${formatDate(note.created_at)}`, 14, y);
  y += 10;

  // Content
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81); // gray-700

  const splitText = doc.splitTextToSize(note.content || "Tidak ada isi", 180);
  doc.text(splitText, 14, y);

  addFooter(doc);
  doc.save(`catatan-${note.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportNotesToPDF(notes: Note[]) {
  const doc = new jsPDF();
  let y = addHeader(doc, `Daftar Catatan (${notes.length} catatan)`);

  notes.forEach((note, index) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text(`${index + 1}. ${note.title}`, 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    const meta = [
      note.category && `Kategori: ${note.category}`,
      formatDate(note.created_at),
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(meta, 20, y);
    y += 5;

    if (note.content) {
      doc.setTextColor(55, 65, 81);
      const preview = note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "");
      const splitText = doc.splitTextToSize(preview, 170);
      doc.text(splitText, 20, y);
      y += splitText.length * 5;
    }

    y += 4;
  });

  addFooter(doc);
  doc.save("daftar-catatan.pdf");
}

export function exportShoppingListToPDF(list: ShoppingList, items: ShoppingListItem[]) {
  const doc = new jsPDF();
  let y = addHeader(doc, "Daftar Belanja");

  // List name
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(list.name, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Dibuat: ${formatDate(list.created_at)}`, 14, y);
  y += 4;
  doc.text(`Status: ${list.is_completed ? "Selesai" : "Aktif"}`, 14, y);
  y += 10;

  // Table header
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(14, y, 182, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("No", 18, y + 6);
  doc.text("Barang", 30, y + 6);
  doc.text("Jumlah", 110, y + 6);
  doc.text("Harga", 135, y + 6);
  doc.text("Total", 165, y + 6);
  y += 10;

  // Items
  let totalEstimate = 0;
  items.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const itemTotal = (item.estimated_price || 0) * (item.quantity || 1);
    totalEstimate += itemTotal;

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);

    // Checkbox
    doc.rect(14, y - 3, 4, 4);
    if (item.is_checked) {
      doc.setFillColor(16, 185, 129);
      doc.rect(14, y - 3, 4, 4, "F");
    }

    doc.text(`${index + 1}`, 22, y);
    doc.text(item.item_name, 30, y);
    doc.text(`${item.quantity} ${item.unit || "pcs"}`, 110, y);
    doc.text(formatCurrency(item.estimated_price || 0), 135, y);
    doc.text(formatCurrency(itemTotal), 165, y);

    y += 7;
  });

  // Total
  y += 4;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Total Estimasi:", 130, y);
  doc.setFontSize(14);
  doc.text(formatCurrency(totalEstimate), 160, y);

  addFooter(doc);
  doc.save(`belanja-${list.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportFinanceToPDF(records: FinanceRecord[], period: string) {
  const doc = new jsPDF();
  let y = addHeader(doc, `Laporan Keuangan - ${period}`);

  const totalIncome = records
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalIncome - totalExpense;

  // Summary
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 25, "F");

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Pemasukan", 24, y + 8);
  doc.text("Pengeluaran", 84, y + 8);
  doc.text("Saldo", 148, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(totalIncome), 24, y + 20);
  doc.setTextColor(239, 68, 68);
  doc.text(formatCurrency(totalExpense), 84, y + 20);
  doc.setTextColor(balance >= 0 ? 16 : 239, balance >= 0 ? 185 : 68, balance >= 0 ? 129 : 68);
  doc.text(formatCurrency(balance), 148, y + 20);

  y += 35;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("No", 18, y + 6);
  doc.text("Tanggal", 30, y + 6);
  doc.text("Kategori", 60, y + 6);
  doc.text("Tipe", 110, y + 6);
  doc.text("Jumlah", 145, y + 6);
  y += 10;

  // Records
  records.forEach((record, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);

    doc.text(`${index + 1}`, 18, y);
    doc.text(formatDate(record.transaction_date), 30, y);
    doc.text(record.category, 60, y);

    if (record.type === "income") {
      doc.setTextColor(16, 185, 129);
      doc.text("Masuk", 110, y);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text("Keluar", 110, y);
    }

    doc.setTextColor(55, 65, 81);
    doc.text(formatCurrency(record.amount), 145, y);

    y += 7;
  });

  addFooter(doc);
  doc.save(`laporan-keuangan-${period.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
