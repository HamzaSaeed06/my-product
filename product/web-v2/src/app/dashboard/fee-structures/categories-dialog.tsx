"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, ArchiveRestore, Archive } from "lucide-react";
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
import { mockFeeCategories, type FeeCategory } from "@/lib/mock/fee-categories";

// No dedicated page or permission namespace for categories in the real
// backend — managed inline here, gated by the same fee_structure.*
// permissions as Fee Structures themselves.
export function CategoriesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [categories, setCategories] = useState<FeeCategory[]>(mockFeeCategories);
  const [name, setName] = useState("");

  function addCategory() {
    if (!name.trim()) return;
    setCategories((prev) => [...prev, { id: `fc_${Date.now()}`, name: name.trim(), archivedAt: null }]);
    setName("");
    toast.success("Category added.");
  }

  function toggleArchive(id: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, archivedAt: c.archivedAt ? null : new Date().toISOString() } : c)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fee categories</DialogTitle>
          <DialogDescription>The types of charge a Fee Structure can be built from — Tuition, Transport, and so on.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border rounded-[var(--card-radius)] border border-border">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className={category.archivedAt ? "text-sm text-muted-foreground line-through" : "text-sm text-foreground"}>{category.name}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => toggleArchive(category.id)} aria-label={category.archivedAt ? "Restore" : "Archive"}>
                {category.archivedAt ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Button variant="outline" size="icon" onClick={addCategory} disabled={!name.trim()} aria-label="Add category">
            <Plus className="size-4" />
          </Button>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
