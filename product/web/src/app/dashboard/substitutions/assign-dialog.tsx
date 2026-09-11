"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { createSubstitution, getEntriesForSection } from "./actions";

interface SectionOption {
  id: string;
  label: string;
  academicYearId: string;
}

interface TeacherOption {
  id: string;
  name: string;
}

interface EntryOption {
  id: string;
  label: string;
  teacherId: string;
}

export function AssignSubstituteDialog({ sections, teachers }: { sections: SectionOption[]; teachers: TeacherOption[] }) {
  const [entries, setEntries] = useState<EntryOption[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [isLoadingEntries, startLoadingEntries] = useTransition();

  const disabled = sections.length === 0 || teachers.length === 0;
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  function handleSectionChange(sectionId: string | null) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    setSelectedEntryId("");
    startLoadingEntries(async () => {
      const raw = await getEntriesForSection(section.id, section.academicYearId);
      setEntries(
        raw.map((e) => ({
          id: e.id,
          teacherId: e.teacherId,
          label: `${e.dayOfWeek[0]}${e.dayOfWeek.slice(1, 3).toLowerCase()} P${e.periodNumber} — ${e.subject.name} (${e.teacher.user.fullName})`,
        }))
      );
    });
  }

  return (
    <FormDialog
      triggerLabel="+ Assign substitute"
      title="Assign a substitute teacher"
      description={disabled ? "Need at least one section with a timetable, and one teacher, first." : undefined}
      action={createSubstitution}
    >
      <input type="hidden" name="timetableEntryId" value={selectedEntryId} />
      <div className="flex flex-col gap-2">
        <Label>Section</Label>
        <Select disabled={disabled} onValueChange={handleSectionChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Period to cover</Label>
        <Select
          value={selectedEntryId}
          onValueChange={(value) => setSelectedEntryId(value ?? "")}
          disabled={entries.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingEntries ? "Loading…" : "Select a period"} />
          </SelectTrigger>
          <SelectContent>
            {entries.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sub-date">Date</Label>
        <Input id="sub-date" name="date" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Substitute teacher</Label>
        <Select name="substituteTeacherId" disabled={!selectedEntry}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers
              .filter((t) => t.id !== selectedEntry?.teacherId)
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sub-reason">Reason (optional)</Label>
        <Input id="sub-reason" name="reason" />
      </div>
    </FormDialog>
  );
}
