"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCategoryBooksAction, type CategoryBook } from "@/actions/categoryActions";
import { auth } from "@/lib/firebase";

const MAX_BOOKS = 3;
const emptyBook: CategoryBook = { title: "", author: "", link: "", coverUrl: "", note: "" };

interface CategoryBooksDialogProps {
  categoryId: string | null;
  categoryName: string;
  books: CategoryBook[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (books: CategoryBook[]) => void;
}

// Edit the 2–3 Christian books suggested under every issue in a category.
export function CategoryBooksDialog({
  categoryId,
  categoryName,
  books,
  open,
  onOpenChange,
  onSaved,
}: CategoryBooksDialogProps) {
  const [draft, setDraft] = useState<CategoryBook[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(books.length ? books.map((b) => ({ ...emptyBook, ...b })) : [{ ...emptyBook }]);
  }, [open, books]);

  const update = (index: number, field: keyof CategoryBook, value: string) =>
    setDraft((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));

  const save = async () => {
    if (!categoryId) return;
    const incomplete = draft.some((b) => (b.title.trim() || b.author.trim()) && !(b.title.trim() && b.author.trim()));
    if (incomplete) {
      toast.error("Each book needs both a title and an author.");
      return;
    }
    setSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const result = await updateCategoryBooksAction(idToken ?? "", categoryId, draft);
      if (result.success) {
        toast.success(result.message);
        onSaved(draft.filter((b) => b.title.trim() && b.author.trim()));
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Suggested books · {categoryName}
          </DialogTitle>
          <DialogDescription>
            Up to {MAX_BOOKS} books shown under every issue in this category (when Book suggestions is on in Settings).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {draft.map((book, index) => (
            <div key={index} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Book {index + 1}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDraft((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Remove book ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input value={book.title} maxLength={120} onChange={(e) => update(index, "title", e.target.value)} placeholder="e.g. The Purpose Driven Life" />
                </div>
                <div className="space-y-1">
                  <Label>Author *</Label>
                  <Input value={book.author} maxLength={80} onChange={(e) => update(index, "author", e.target.value)} placeholder="e.g. Rick Warren" />
                </div>
                <div className="space-y-1">
                  <Label>Link (where to get it)</Label>
                  <Input value={book.link ?? ""} onChange={(e) => update(index, "link", e.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-1">
                  <Label>Cover image URL</Label>
                  <Input value={book.coverUrl ?? ""} onChange={(e) => update(index, "coverUrl", e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Why this book (one line)</Label>
                <Input value={book.note ?? ""} maxLength={160} onChange={(e) => update(index, "note", e.target.value)} placeholder="e.g. Hope and purpose when life feels heavy" />
              </div>
            </div>
          ))}

          {draft.length < MAX_BOOKS && (
            <Button variant="outline" onClick={() => setDraft((prev) => [...prev, { ...emptyBook }])}>
              <Plus className="mr-2 h-4 w-4" /> Add book
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save books"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
