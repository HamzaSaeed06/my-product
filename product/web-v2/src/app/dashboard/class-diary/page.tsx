"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockClassDiary, type ClassDiaryEntry } from "@/lib/mock/class-diary";
import { getClassDiaryColumns } from "./columns";
import { DiarySheet } from "./diary-sheet";

export default function ClassDiaryPage() {
  const [entries, setEntries] = useState<ClassDiaryEntry[]>(mockClassDiary);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ClassDiaryEntry | null>(null);

  function openCreate() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(entry: ClassDiaryEntry) {
    setEditing(entry);
    setSheetOpen(true);
  }

  function save(data: { sectionId: string; subjectId: string | null; date: string; note: string }, entryId: string | null) {
    if (entryId) {
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...data } : e)));
    } else {
      setEntries((prev) => [{ id: `cd_${Date.now()}`, teacherId: "tch_1", archivedAt: null, ...data }, ...prev]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Class Diary"
        description="A one-line daily log per section — no attachments, no draft/publish step, unlike Homework."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Add entry
          </Button>
        }
      />
      <DataTable
        columns={getClassDiaryColumns(openEdit)}
        data={entries.filter((e) => !e.archivedAt)}
        emptyTitle="No diary entries yet"
        emptyDescription="Log today's class notes for a section."
      />
      <DiarySheet entry={editing} open={sheetOpen} onOpenChange={setSheetOpen} onSave={save} />
    </div>
  );
}
