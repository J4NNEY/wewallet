"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Trash2, History, Save, Download } from "lucide-react";

interface HistoryItem {
  id?: string;
  expression: string;
  result: number;
  created_at?: string;
}

export default function CalculatorPage() {
  const { success, error: showError } = useToast();
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load history from database on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("calculator_history")
          .select("id, expression, result, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data) {
          setHistory(data);
        }
      } catch (err) {
        console.error("Error loading history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const inputNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  }, [display, waitingForOperand]);

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const clear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  const clearEntry = useCallback(() => {
    setDisplay("0");
  }, []);

  const backspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display]);

  const calculate = useCallback((left: number, right: number, op: string): number => {
    switch (op) {
      case "+": return left + right;
      case "-": return left - right;
      case "×": return left * right;
      case "÷": return right !== 0 ? left / right : 0;
      case "%": return left % right;
      default: return right;
    }
  }, []);

  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpression(`${inputValue} ${nextOperation}`);
    } else if (operation) {
      const result = calculate(prevValue, inputValue, operation);
      setPrevValue(result);
      setDisplay(String(result));
      setExpression(`${result} ${nextOperation}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, prevValue, operation, calculate]);

  const handleEquals = useCallback(() => {
    const inputValue = parseFloat(display);

    if (prevValue !== null && operation) {
      const result = calculate(prevValue, inputValue, operation);
      const fullExpression = `${prevValue} ${operation} ${inputValue}`;
      
      setDisplay(String(result));
      setExpression(`${fullExpression} =`);
      
      // Add to history
      setHistory((prev) => [
        { expression: fullExpression, result },
        ...prev.slice(0, 49), // Keep last 50 items
      ]);

      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, prevValue, operation, calculate]);

  const handlePercent = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  }, [display]);

  const handlePlusMinus = useCallback(() => {
    const value = parseFloat(display);
    setDisplay(String(-value));
  }, [display]);

  const saveHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || history.length === 0) {
      showError("Tidak ada riwayat untuk disimpan");
      return;
    }

    // Filter only unsaved history (no id)
    const unsaved = history.filter((h) => !h.id);
    if (unsaved.length === 0) {
      showError("Semua riwayat sudah tersimpan");
      return;
    }

    const records = unsaved.map((h) => ({
      user_id: user.id,
      expression: h.expression,
      result: h.result,
    }));

    try {
      const { data, error } = await supabase
        .from("calculator_history")
        .insert(records)
        .select();

      if (error) throw error;

      // Update history with IDs
      if (data) {
        setHistory((prev) =>
          prev.map((h, i) => (h.id ? h : { ...h, id: data.shift()?.id }))
        );
      }

      success(`${unsaved.length} riwayat berhasil disimpan!`);
    } catch (err) {
      console.error("Error saving history:", err);
      showError("Gagal menyimpan riwayat. Coba lagi.");
    }
  };

  const clearHistory = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from("calculator_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setHistory([]);
      success("Riwayat berhasil dihapus!");
    } catch (err) {
      console.error("Error clearing history:", err);
      showError("Gagal menghapus riwayat. Coba lagi.");
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("calculator_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Error deleting history item:", err);
      showError("Gagal menghapus riwayat.");
    }
  };

  const buttons = [
    { label: "C", action: clear, variant: "secondary" as const },
    { label: "CE", action: clearEntry, variant: "secondary" as const },
    { label: "%", action: handlePercent, variant: "secondary" as const },
    { label: "÷", action: () => performOperation("÷"), variant: "default" as const },
    { label: "7", action: () => inputNumber("7") },
    { label: "8", action: () => inputNumber("8") },
    { label: "9", action: () => inputNumber("9") },
    { label: "×", action: () => performOperation("×"), variant: "default" as const },
    { label: "4", action: () => inputNumber("4") },
    { label: "5", action: () => inputNumber("5") },
    { label: "6", action: () => inputNumber("6") },
    { label: "-", action: () => performOperation("-"), variant: "default" as const },
    { label: "1", action: () => inputNumber("1") },
    { label: "2", action: () => inputNumber("2") },
    { label: "3", action: () => inputNumber("3") },
    { label: "+", action: () => performOperation("+"), variant: "default" as const },
    { label: "±", action: handlePlusMinus },
    { label: "0", action: () => inputNumber("0") },
    { label: ".", action: inputDot },
    { label: "=", action: handleEquals, variant: "default" as const },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <PageHeader title="Kalkulator" description="Hitung cepat & tersimpan">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4 mr-2" />
          Riwayat
        </Button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calculator */}
        <Card className="flex-1">
          <CardContent className="p-3 sm:p-4">
            {/* Display */}
            <div className="bg-gradient-soft border border-[#ffe4ec] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="text-right text-sm text-gray-500 h-6 truncate">
                {expression}
              </div>
              <div className="text-right text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {display}
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {buttons.map((btn) => (
                <Button
                  key={btn.label}
                  variant={btn.variant || "outline"}
                  className="h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  onClick={btn.action}
                >
                  {btn.label}
                </Button>
              ))}
            </div>

            {/* Backspace */}
            <Button
              variant="ghost"
              className="w-full mt-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={backspace}
            >
              Hapus
            </Button>
          </CardContent>
        </Card>

        {/* History Panel */}
        {showHistory && (
          <Card className="w-full lg:w-64">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Riwayat</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={saveHistory} title="Simpan riwayat">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearHistory} title="Hapus semua">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 max-h-[200px] lg:max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 py-1">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="Belum ada riwayat"
                  className="py-6"
                />
              ) : (
                <div className="space-y-1">
                  {history.map((item) => (
                    <div
                      key={item.id || item.expression}
                      className="group p-2 rounded hover:bg-gray-50 cursor-pointer flex items-start justify-between gap-2"
                      onClick={() => setDisplay(String(item.result))}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 truncate">{item.expression}</div>
                        <div className="text-sm font-semibold">= {item.result}</div>
                      </div>
                      {item.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id!);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-opacity"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
