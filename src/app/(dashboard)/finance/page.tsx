"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Edit,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportFinanceToPDF } from "@/lib/export/pdf";
import { exportFinanceToExcel } from "@/lib/export/excel";
import { financeRecordSchema } from "@/lib/validations";
import type { FinanceRecord } from "@/types";
import { FinanceCharts } from "@/components/finance/finance-charts";
import { Chip } from "@/components/ui/chip";

const DEFAULT_CATEGORIES = [
  "Gaji",
  "Makan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

type Period = "daily" | "weekly" | "monthly";

export default function FinancePage() {
  const { success, error: showError } = useToast();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [period, setPeriod] = useState<Period>("monthly");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchRecords = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filterType !== "all") {
      query = query.eq("type", filterType);
    }

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  }, [filterType, filterCategory]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const getPeriodRange = () => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end: now };
  };

  const { start: periodStart } = getPeriodRange();

  const periodRecords = records.filter((r) => {
    const date = new Date(r.transaction_date);
    return date >= periodStart;
  });

  const totalIncome = periodRecords
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = periodRecords
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalIncome - totalExpense;

  const categories = [
    ...new Set(records.map((r) => r.category)),
  ];

  const handleCreateOrUpdate = async () => {
    const result = financeRecordSchema.safeParse({
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount) || 0,
      description: formData.description,
      transaction_date: formData.transaction_date,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const recordData = {
      user_id: user.id,
      type: result.data.type,
      category: result.data.category,
      amount: result.data.amount,
      description: result.data.description || null,
      transaction_date: result.data.transaction_date,
    };

    try {
      if (editingRecord) {
        const { error } = await supabase
          .from("finance_records")
          .update(recordData)
          .eq("id", editingRecord.id);

        if (error) throw error;
        success("Transaksi berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("finance_records").insert(recordData);
        if (error) throw error;
        success("Transaksi berhasil ditambahkan!");
      }

      resetForm();
      fetchRecords();
    } catch (err) {
      console.error("Error saving transaction:", err);
      showError("Gagal menyimpan transaksi. Coba lagi.");
    }
  };

  const handleEdit = (record: FinanceRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      category: record.category,
      amount: String(record.amount),
      description: record.description || "",
      transaction_date: record.transaction_date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("finance_records").delete().eq("id", id);
      if (error) throw error;
      success("Transaksi berhasil dihapus!");
      fetchRecords();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      showError("Gagal menghapus transaksi.");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      category: "",
      amount: "",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setEditingRecord(null);
    setShowForm(false);
    setValidationErrors({});
  };

  const periodLabels = {
    daily: "Hari Ini",
    weekly: "Minggu Ini",
    monthly: "Bulan Ini",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader label="Summary" title="Keuangan Kamu">
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-full h-12 w-12 p-0"
          aria-label="Tambah transaksi"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </PageHeader>

      {/* Action Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          <Filter className="h-4 w-4 text-primary-text" aria-hidden="true" />
          Filter
        </button>
        <button
          onClick={() => exportFinanceToPDF(records, periodLabels[period])}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          <FileText className="h-4 w-4 text-primary-text" aria-hidden="true" />
          PDF
        </button>
        <button
          onClick={() => exportFinanceToExcel(records, periodLabels[period])}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4 text-secondary" aria-hidden="true" />
          Excel
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-semibold text-on-surface mb-1.5 block">
                  Tipe
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "Semua" },
                    { value: "income", label: "Pemasukan" },
                    { value: "expense", label: "Pengeluaran" },
                  ].map((opt) => (
                    <Chip
                      key={opt.value}
                      active={filterType === opt.value}
                      onClick={() => setFilterType(opt.value as typeof filterType)}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-on-surface mb-1.5 block">
                  Kategori
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Chip
                    active={filterCategory === "all"}
                    onClick={() => setFilterCategory("all")}
                  >
                    Semua
                  </Chip>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      active={filterCategory === cat}
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingRecord ? "Edit Transaksi" : "Tambah Transaksi"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-on-surface mb-2 block">
              Tipe Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFormData((prev) => ({ ...prev, type: "income" }))}
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-colors",
                  formData.type === "income"
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container text-on-surface-variant"
                )}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Pemasukan
              </button>
              <button
                onClick={() => setFormData((prev) => ({ ...prev, type: "expense" }))}
                className={cn(
                  "flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-colors",
                  formData.type === "expense"
                    ? "bg-error text-on-error"
                    : "bg-surface-container text-on-surface-variant"
                )}
              >
                <ArrowDownCircle className="h-4 w-4" />
                Pengeluaran
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-on-surface mb-1.5 block">
              Kategori
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  active={formData.category === cat}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, category: cat }));
                    if (validationErrors.category) setValidationErrors({});
                  }}
                >
                  {cat}
                </Chip>
              ))}
            </div>
            {validationErrors.category && (
              <p className="text-xs text-error mt-1">{validationErrors.category}</p>
            )}
          </div>
          <Input
            label="Jumlah (Rp)"
            type="number"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, amount: e.target.value }));
              if (validationErrors.amount) setValidationErrors({});
            }}
            error={validationErrors.amount}
          />
          <Input
            label="Tanggal"
            type="date"
            value={formData.transaction_date}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, transaction_date: e.target.value }));
              if (validationErrors.transaction_date) setValidationErrors({});
            }}
            error={validationErrors.transaction_date}
          />
          <div>
            <label className="text-sm font-semibold text-on-surface mb-1.5 block">
              Keterangan (opsional)
            </label>
            <textarea
              className="w-full min-h-[60px] rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Catatan tambahan..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Batal
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingRecord ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Period Selector */}
      <div className="inline-flex rounded-full bg-surface-container-low p-1 gap-1">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all",
              period === p
                ? "bg-surface-container-lowest text-primary-text shadow-card"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-secondary-container/40 text-secondary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {periodLabels[period]}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4">Pemasukan</p>
            <p className="text-xl font-extrabold text-on-surface mt-0.5 tabular-nums">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-full h-16 text-secondary-container/70 pointer-events-none"
            viewBox="0 0 200 64"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0 42 Q 25 20 50 34 T 100 34 T 150 30 T 200 26 L 200 64 L 0 64 Z" />
          </svg>
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-full h-24 text-secondary-container/35 pointer-events-none"
            viewBox="0 0 200 96"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0 60 Q 40 30 80 50 T 160 44 T 200 48 L 200 96 L 0 96 Z" />
          </svg>
        </Card>
        <Card className="relative overflow-hidden">
          <CardContent className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-error-container/60 text-error">
                <TrendingDown className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-error">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                {periodLabels[period]}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-4">Pengeluaran</p>
            <p className="text-xl font-extrabold text-on-surface mt-0.5 tabular-nums">
              {formatCurrency(totalExpense)}
            </p>
          </CardContent>
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-full h-16 text-primary-container/60 pointer-events-none"
            viewBox="0 0 200 64"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0 42 Q 25 20 50 34 T 100 34 T 150 30 T 200 26 L 200 64 L 0 64 Z" />
          </svg>
          <svg
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-full h-24 text-primary-container/30 pointer-events-none"
            viewBox="0 0 200 96"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0 60 Q 40 30 80 50 T 160 44 T 200 48 L 200 96 L 0 96 Z" />
          </svg>
        </Card>
        <div className="relative overflow-hidden rounded-xl bg-gradient-pink shadow-lift">
          <div
            aria-hidden="true"
            className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/15"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-12 right-16 h-24 w-24 rounded-full bg-white/10"
          />
          <div className="relative p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white/20 text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-semibold text-white/85",
                  balance < 0 && "text-error"
                )}
              >
                {balance >= 0 ? "Sisa saldo" : "Minus"}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-4">Saldo</p>
            <p className="text-xl font-extrabold text-white mt-0.5 tabular-nums">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <FinanceCharts records={periodRecords} />

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Belum ada transaksi"
              description="Catat pemasukan atau pengeluaran pertamamu biar keuangan terpantau."
              action={
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Tambah transaksi pertama
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/60 hover:bg-surface-container-low transition-colors"
                >
                  <div
                    className={cn(
                      "p-2 rounded-xl flex-shrink-0",
                      record.type === "income"
                        ? "bg-secondary-container/40 text-secondary"
                        : "bg-error-container/60 text-error"
                    )}
                  >
                    {record.type === "income" ? (
                      <ArrowUpCircle className="h-5 w-5" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">
                      {record.category}
                    </p>
                    {record.description && (
                      <p className="text-xs text-on-surface-variant truncate">
                        {record.description}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant/70">
                      {formatDate(record.transaction_date)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "font-bold tabular-nums",
                      record.type === "income"
                        ? "text-secondary"
                        : "text-error"
                    )}
                  >
                    {record.type === "income" ? "+" : "-"}{" "}
                    {formatCurrency(record.amount)}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-error"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


