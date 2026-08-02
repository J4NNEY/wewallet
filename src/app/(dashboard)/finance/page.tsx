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
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportFinanceToPDF } from "@/lib/export/pdf";
import { exportFinanceToExcel } from "@/lib/export/excel";
import { financeRecordSchema } from "@/lib/validations";
import type { FinanceRecord } from "@/types";
import { FinanceCharts } from "@/components/finance/finance-charts";

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
      <PageHeader title="Keuangan" description="Keuangan kamu">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportFinanceToPDF(records, periodLabels[period])}
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportFinanceToExcel(records, periodLabels[period])}
        >
          <FileSpreadsheet className="h-4 w-4 mr-1" />
          Excel
        </Button>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Baru
        </Button>
      </PageHeader>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Tipe
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "Semua" },
                    { value: "income", label: "Pemasukan" },
                    { value: "expense", label: "Pengeluaran" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={filterType === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(opt.value as typeof filterType)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Kategori
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filterCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory("all")}
                  >
                    Semua
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={filterCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat}
                    </Button>
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
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tipe Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={formData.type === "income" ? "default" : "outline"}
                className={formData.type === "income" ? "bg-[#ffb6c9]" : ""}
                onClick={() => setFormData((prev) => ({ ...prev, type: "income" }))}
              >
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Pemasukan
              </Button>
              <Button
                variant={formData.type === "expense" ? "default" : "outline"}
                className={formData.type === "expense" ? "bg-red-500" : ""}
                onClick={() => setFormData((prev) => ({ ...prev, type: "expense" }))}
              >
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Pengeluaran
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Kategori
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={formData.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, category: cat }));
                    if (validationErrors.category) setValidationErrors({});
                  }}
                >
                  {cat}
                </Button>
              ))}
            </div>
            {validationErrors.category && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.category}</p>
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Keterangan (opsional)
            </label>
            <textarea
              className="w-full min-h-[60px] rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e85d8a]"
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
      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#fff0f4] rounded-xl">
                <TrendingUp className="h-5 w-5 text-[#e85d8a]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pemasukan</p>
                <p className="text-xl font-bold text-[#e85d8a]">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pengeluaran</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p
                  className={`text-xl font-bold ${
                    balance >= 0 ? "text-[#e85d8a]" : "text-red-500"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      record.type === "income"
                        ? "bg-pink-50"
                        : "bg-red-50"
                    }`}
                  >
                    {record.type === "income" ? (
                      <ArrowUpCircle className="h-5 w-5 text-[#e85d8a]" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {record.category}
                    </p>
                    {record.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {record.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(record.transaction_date)}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      record.type === "income"
                        ? "text-[#e85d8a]"
                        : "text-red-500"
                    }`}
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
                      className="h-8 w-8 text-red-500"
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


