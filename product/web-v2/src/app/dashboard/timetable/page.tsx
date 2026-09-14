"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { StatusDot } from "@/components/status-dot";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CalendarClock } from "lucide-react";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockTimetables, mockTimetableEntries, type Timetable, type TimetableEntry } from "@/lib/mock/timetable";
import { TimetableGrid } from "./timetable-grid";
import { EntryDialog, type EntrySlot } from "./entry-dialog";

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => {
    const className = mockClasses.find((c) => c.id === s.classId)?.name;
    const campusName = mockCampuses.find((c) => c.id === s.campusId)?.name;
    return { value: s.id, label: `${className} ${s.name} · ${campusName}` };
  });

export default function TimetablePage() {
  const [sectionId, setSectionId] = useState<string | null>(SECTION_OPTIONS[0]?.value ?? null);
  const [timetables, setTimetables] = useState<Timetable[]>(mockTimetables);
  const [entries, setEntries] = useState<TimetableEntry[]>(mockTimetableEntries);
  const [slot, setSlot] = useState<EntrySlot | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const timetable = timetables.find((t) => t.sectionId === sectionId);
  const sectionEntries = timetable ? entries.filter((e) => e.timetableId === timetable.id) : [];

  function createTimetable() {
    if (!sectionId) return;
    const id = `tt_${sectionId}`;
    setTimetables((prev) => [...prev, { id, sectionId, academicYearId: "ay_2026", status: "DRAFT", publishedAt: null }]);
  }

  function saveEntry(day: EntrySlot["day"], period: number, subjectId: string, teacherId: string, entryId: string | null) {
    if (!timetable) return;
    if (entryId) {
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, subjectId, teacherId } : e)));
      toast.success("Period updated.");
    } else {
      const id = `${timetable.id}_e${Date.now()}`;
      setEntries((prev) => [...prev, { id, timetableId: timetable.id, dayOfWeek: day, periodNumber: period, subjectId, teacherId }]);
      toast.success("Period added.");
    }
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    toast.success("Period removed.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Timetable"
        description="The weekly period-by-period schedule for one section. Publish once it's ready — the section's teachers and students only see a published timetable."
        actions={
          timetable ? (
            <>
              <StatusDot tone={timetable.status === "PUBLISHED" ? "success" : "neutral"}>
                {timetable.status === "PUBLISHED" ? "Published" : "Draft"}
              </StatusDot>
              {timetable.status === "DRAFT" && (
                <Button size="sm" onClick={() => setPublishOpen(true)} disabled={sectionEntries.length === 0}>
                  Publish
                </Button>
              )}
            </>
          ) : null
        }
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Section</span>
        <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" className="w-64" />
      </div>

      {timetable ? (
        <TimetableGrid entries={sectionEntries} onCellClick={setSlot} />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClock />
            </EmptyMedia>
            <EmptyTitle>No timetable yet for this section</EmptyTitle>
            <EmptyDescription>Create one, then fill in each period.</EmptyDescription>
          </EmptyHeader>
          <Button size="sm" onClick={createTimetable}>
            Create timetable
          </Button>
        </Empty>
      )}

      <EntryDialog slot={slot} onOpenChange={(open) => !open && setSlot(null)} onSave={saveEntry} onRemove={removeEntry} />
      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish this timetable?"
        description="Makes it visible to this section's teachers and students. You can still edit periods afterwards."
        confirmLabel="Publish"
        successMessage="Timetable published."
        onConfirm={() => setTimetables((prev) => prev.map((t) => (t.id === timetable!.id ? { ...t, status: "PUBLISHED", publishedAt: new Date().toISOString() } : t)))}
      />
    </div>
  );
}
