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
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit,
  FileText,
  Tag,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { exportNoteToPDF, exportNotesToPDF } from "@/lib/export/pdf";
import { exportNotesToExcel } from "@/lib/export/excel";
import { noteSchema } from "@/lib/validations";
import type { Note } from "@/types";

const CATEGORIES = [
  "Semua",
  "Pribadi",
  "Kerjaan",
  "Rekap Transaksi",
  "Ide",
  "Lainnya",
];

export default function NotesPage() {
  const { success, error: showError } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id);

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    if (selectedCategory !== "Semua") {
      query = query.eq("category", selectedCategory);
    }

    query = query.order("is_pinned", { ascending: false });
    query = query.order("created_at", { ascending: sortBy === "oldest" });

    const { data, error } = await query;

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  }, [searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSave = async () => {
    if (!editingNote) return;

    // Validate with zod
    const result = noteSchema.safeParse({
      title: editingNote.title,
      content: editingNote.content,
      category: editingNote.category,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (editingNote.id) {
        const { error: updateError } = await supabase
          .from("notes")
          .update({
            title: result.data.title,
            content: result.data.content || "",
            category: result.data.category || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNote.id);

        if (updateError) throw updateError;
        success("Catatan berhasil diperbarui!");
      } else {
        const { error: insertError } = await supabase.from("notes").insert({
          user_id: user.id,
          title: result.data.title,
          content: result.data.content || "",
          category: result.data.category || null,
        });

        if (insertError) throw insertError;
        success("Catatan berhasil dibuat!");
      }

      setIsEditing(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      console.error("Error saving note:", err);
      showError("Gagal menyimpan catatan. Coba lagi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("notes").delete().eq("id", id);
      if (deleteError) throw deleteError;
      success("Catatan berhasil dihapus!");
      fetchNotes();
    } catch (err) {
      console.error("Error deleting note:", err);
      showError("Gagal menghapus catatan. Coba lagi.");
    }
  };

  const handleTogglePin = async (note: Note) => {
    const supabase = createClient();
    await supabase
      .from("notes")
      .update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() })
      .eq("id", note.id);
    fetchNotes();
  };

  const startEdit = (note?: Note) => {
    setEditingNote(
      note || { title: "", content: "", category: undefined }
    );
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catatan</h1>
          <p className="text-sm text-gray-600">Catatan kamu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportNotesToPDF(notes)}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportNotesToExcel(notes)}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button onClick={() => startEdit()} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Baru
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
        >
          {sortBy === "newest" ? "Terbaru" : "Terlama"}
        </Button>
      </div>

      {/* Editor Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingNote(null);
          setValidationErrors({});
        }}
        title={editingNote?.id ? "Edit Catatan" : "Catatan Baru"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Judul"
            placeholder="Judul catatan"
            value={editingNote?.title || ""}
            onChange={(e) => {
              setEditingNote((prev) => ({ ...prev!, title: e.target.value }));
              if (validationErrors.title) {
                setValidationErrors((prev) => ({ ...prev, title: "" }));
              }
            }}
            error={validationErrors.title}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.filter((c) => c !== "Semua").map((cat) => (
                <Button
                  key={cat}
                  variant={editingNote?.category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setEditingNote((prev) => ({
                      ...prev!,
                      category: prev?.category === cat ? undefined : cat,
                    }))
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Isi Catatan
            </label>
            <textarea
              className="w-full min-h-[200px] rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Tulis sesuatu..."
              value={editingNote?.content || ""}
              onChange={(e) =>
                setEditingNote((prev) => ({ ...prev!, content: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditingNote(null);
                setValidationErrors({});
              }}
            >
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Notes Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Memuat catatan...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada catatan</p>
          <Button variant="link" onClick={() => startEdit()} className="mt-2">
            Buat catatan pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={`group hover:shadow-md transition-shadow ${
                note.is_pinned ? "ring-2 ring-pink-200" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && (
                        <Pin className="h-3 w-3 text-pink-600 flex-shrink-0" />
                      )}
                      <CardTitle className="text-base truncate">
                        {note.title}
                      </CardTitle>
                    </div>
                    {note.category && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Tag className="h-3 w-3" />
                        {note.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => exportNoteToPDF(note)}
                      title="Export PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleTogglePin(note)}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {note.content || "Tidak ada isi"}
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  {formatDate(note.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
