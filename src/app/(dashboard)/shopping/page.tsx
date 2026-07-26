"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { exportShoppingListToPDF } from "@/lib/export/pdf";
import { exportShoppingListToExcel } from "@/lib/export/excel";
import { shoppingListSchema, shoppingItemSchema } from "@/lib/validations";
import type { ShoppingList, ShoppingListItem } from "@/types";

export default function ShoppingPage() {
  const { success, error: showError } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    quantity: 1,
    unit: "",
    estimated_price: 0,
  });
  const [listErrors, setListErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const fetchLists = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLists(data);
    }
    setLoading(false);
  }, []);

  const fetchItems = useCallback(async (listId: string) => {
    setLoadingItems(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("shopping_list_items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoadingItems(false);
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (selectedList) {
      fetchItems(selectedList);
    }
  }, [selectedList, fetchItems]);

  const handleCreateList = async () => {
    const result = shoppingListSchema.safeParse({ name: newListName });
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setListErrors(errors);
      return;
    }

    setListErrors({});
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name: result.data.name })
        .select()
        .single();

      if (error) throw error;

      setLists((prev) => [data, ...prev]);
      setNewListName("");
      setShowCreateModal(false);
      setSelectedList(data.id);
      success("Daftar belanja berhasil dibuat!");
    } catch (err) {
      console.error("Error creating list:", err);
      showError("Gagal membuat daftar. Coba lagi.");
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Hapus daftar belanja ini?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("shopping_lists").delete().eq("id", listId);
      if (error) throw error;

      setLists((prev) => prev.filter((l) => l.id !== listId));
      if (selectedList === listId) {
        setSelectedList(null);
        setItems([]);
      }
      success("Daftar berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting list:", err);
      showError("Gagal menghapus daftar. Coba lagi.");
    }
  };

  const handleDuplicateList = async (list: ShoppingList) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: newList, error } = await supabase
        .from("shopping_lists")
        .insert({ user_id: user.id, name: `${list.name} (Copy)` })
        .select()
        .single();

      if (error || !newList) throw error;

      const { data: originalItems } = await supabase
        .from("shopping_list_items")
        .select("*")
        .eq("list_id", list.id);

      if (originalItems && originalItems.length > 0) {
        const newItems = originalItems.map((item) => ({
          list_id: newList.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit: item.unit,
          estimated_price: item.estimated_price,
          is_checked: false,
        }));
        await supabase.from("shopping_list_items").insert(newItems);
      }

      fetchLists();
      setSelectedList(newList.id);
      success("Daftar berhasil diduplikasi!");
    } catch (err) {
      console.error("Error duplicating list:", err);
      showError("Gagal menduplikasi daftar. Coba lagi.");
    }
  };

  const handleToggleComplete = async (list: ShoppingList) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shopping_lists")
        .update({ is_completed: !list.is_completed })
        .eq("id", list.id);

      if (error) throw error;
      fetchLists();
    } catch (err) {
      console.error("Error toggling complete:", err);
      showError("Gagal mengupdate status.");
    }
  };

  const handleAddItem = async () => {
    const result = shoppingItemSchema.safeParse(newItem);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setItemErrors(errors);
      return;
    }

    setItemErrors({});

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shopping_list_items")
        .insert({
          list_id: selectedList,
          item_name: result.data.item_name,
          quantity: result.data.quantity,
          unit: result.data.unit || null,
          estimated_price: result.data.estimated_price,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, data]);
      setNewItem({ item_name: "", quantity: 1, unit: "", estimated_price: 0 });
      setShowAddItem(false);
      success("Item berhasil ditambahkan!");
    } catch (err) {
      console.error("Error adding item:", err);
      showError("Gagal menambahkan item. Coba lagi.");
    }
  };

  const handleToggleItem = async (item: ShoppingListItem) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shopping_list_items")
        .update({ is_checked: !item.is_checked })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
      );
    } catch (err) {
      console.error("Error toggling item:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("shopping_list_items").delete().eq("id", itemId);
      if (error) throw error;

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      success("Item berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting item:", err);
      showError("Gagal menghapus item.");
    }
  };

  const totalEstimate = items.reduce(
    (sum, item) => sum + (item.estimated_price || 0) * (item.quantity || 1),
    0
  );
  const checkedCount = items.filter((i) => i.is_checked).length;
  const selectedListData = lists.find((l) => l.id === selectedList);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Belanja</h1>
          <p className="text-sm text-gray-600">Daftar belanja kamu</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Buat Daftar
        </Button>
      </div>

      {/* Create List Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setListErrors({});
        }}
        title="Buat Daftar Belanja"
      >
        <div className="space-y-4">
          <Input
            label="Nama Daftar"
            placeholder="Contoh: Belanja Bulanan"
            value={newListName}
            onChange={(e) => {
              setNewListName(e.target.value);
              if (listErrors.name) setListErrors({});
            }}
            error={listErrors.name}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateList}>Buat</Button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setItemErrors({});
        }}
        title="Tambah Item"
      >
        <div className="space-y-4">
          <Input
            label="Nama Barang"
            placeholder="Contoh: Beras"
            value={newItem.item_name}
            onChange={(e) => {
              setNewItem((prev) => ({ ...prev, item_name: e.target.value }));
              if (itemErrors.item_name) setItemErrors({});
            }}
            error={itemErrors.item_name}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jumlah"
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => {
                setNewItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }));
                if (itemErrors.quantity) setItemErrors({});
              }}
              error={itemErrors.quantity}
            />
            <Input
              label="Satuan"
              placeholder="pcs, kg, liter"
              value={newItem.unit}
              onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
            />
          </div>
          <Input
            label="Estimasi Harga"
            type="number"
            min="0"
            value={newItem.estimated_price}
            onChange={(e) => {
              setNewItem((prev) => ({ ...prev, estimated_price: parseFloat(e.target.value) || 0 }));
              if (itemErrors.estimated_price) setItemErrors({});
            }}
            error={itemErrors.estimated_price}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddItem(false)}>
              Batal
            </Button>
            <Button onClick={handleAddItem}>Tambah</Button>
          </div>
        </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lists Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900">Daftar Saya</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat...</p>
          ) : lists.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada daftar belanja</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <Card
                  key={list.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedList === list.id ? "ring-2 ring-pink-500" : ""
                  } ${list.is_completed ? "opacity-60" : ""}`}
                  onClick={() => setSelectedList(list.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {list.is_completed && <Check className="h-4 w-4 text-pink-600" />}
                          <p className="font-medium text-gray-900 truncate">{list.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(list.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleDuplicateList(list); }}
                          title="Duplikasi"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleToggleComplete(list); }}
                          title={list.is_completed ? "Batalkan selesai" : "Tandai selesai"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Items Panel */}
        <div className="lg:col-span-2">
          {selectedList ? (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">{selectedListData?.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {checkedCount}/{items.length} item - Total: {formatCurrency(totalEstimate)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedListData && exportShoppingListToPDF(selectedListData, items)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedListData && exportShoppingListToExcel(selectedListData, items)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button size="sm" onClick={() => setShowAddItem(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingItems ? (
                  <p className="text-sm text-gray-500 text-center py-4">Memuat item...</p>
                ) : items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada item</p>
                    <Button variant="link" size="sm" onClick={() => setShowAddItem(true)} className="mt-1">
                      Tambah item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          item.is_checked ? "bg-pink-50 border-pink-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <button
                          onClick={() => handleToggleItem(item)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.is_checked ? "bg-pink-500 border-pink-500" : "border-gray-300"
                          }`}
                        >
                          {item.is_checked && <Check className="h-3 w-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${item.is_checked ? "line-through text-gray-500" : "text-gray-900"}`}>
                            {item.item_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit || "pcs"} - {formatCurrency(item.estimated_price || 0)}/item
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency((item.estimated_price || 0) * (item.quantity || 1))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Pilih atau buat daftar baru</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
