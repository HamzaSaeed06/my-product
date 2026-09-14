"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Combobox } from "@/components/combobox";
import { Input } from "@/components/ui/input";
import { mockSections, getSectionRoster } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAttendance, mockAttendanceCorrections, TODAY, type AttendanceRecord, type AttendanceCorrectionRequest, type AttendanceStatus } from "@/lib/mock/attendance";
import { AttendanceRosterForm } from "./roster-form";
import { AttendanceTable } from "./attendance-table";
import { CorrectionDialog } from "./correction-dialog";
import { PendingCorrections } from "./pending-corrections";

const SECTION_OPTIONS = mockSections
  .filter((s) => !s.archived)
  .map((s) => {
    const className = mockClasses.find((c) => c.id === s.classId)?.name;
    const campusName = mockCampuses.find((c) => c.id === s.campusId)?.name;
    return { value: s.id, label: `${className} ${s.name} · ${campusName}` };
  });

export default function AttendancePage() {
  const [sectionId, setSectionId] = useState<string | null>("sec_2");
  const [date, setDate] = useState(TODAY);
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>(mockAttendanceCorrections);
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRecord | null>(null);

  const roster = sectionId ? getSectionRoster(sectionId) : [];
  const existing = records.filter((r) => r.sectionId === sectionId && r.date === date);
  const dayCorrections = corrections.filter(
    (c) => c.status === "PENDING" && existing.some((r) => r.id === c.attendanceId),
  );

  function submitRoster(statuses: Record<string, AttendanceStatus>) {
    if (!sectionId) return;
    const newRecords: AttendanceRecord[] = roster.map((s) => ({
      id: `att_${s.id}_${date}`,
      studentId: s.id,
      sectionId,
      date,
      status: statuses[s.id] ?? "PRESENT",
      markedById: "usr_teacher_1",
    }));
    setRecords((prev) => [...prev, ...newRecords]);
    toast.success(`Attendance submitted for ${roster.length} students.`);
  }

  function requestCorrection(requestedStatus: AttendanceStatus, reason: string) {
    if (!correctionTarget) return;
    setCorrections((prev) => [
      ...prev,
      {
        id: `atc_${Date.now()}`,
        attendanceId: correctionTarget.id,
        requestedStatus,
        reason,
        status: "PENDING",
        requestedById: "usr_teacher_1",
        requestedAt: new Date().toISOString(),
        decidedById: null,
        decidedAt: null,
      },
    ]);
    toast.success("Correction request sent for approval.");
  }

  function decideCorrection(correctionId: string, approve: boolean) {
    const correction = corrections.find((c) => c.id === correctionId);
    if (!correction) return;
    setCorrections((prev) =>
      prev.map((c) => (c.id === correctionId ? { ...c, status: approve ? "APPROVED" : "REJECTED", decidedById: "usr_incharge_1", decidedAt: new Date().toISOString() } : c)),
    );
    if (approve) {
      setRecords((prev) => prev.map((r) => (r.id === correction.attendanceId ? { ...r, status: correction.requestedStatus } : r)));
    }
    toast.success(approve ? "Correction approved." : "Correction rejected.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Marked once per section per day. Once submitted, a row is corrected only through an approval request, never edited directly."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Section</span>
        <Combobox options={SECTION_OPTIONS} value={sectionId} onChange={setSectionId} placeholder="Select a section" className="w-64" />
        <span className="ml-2 text-sm text-muted-foreground">Date</span>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found in this section.</p>
      ) : existing.length === 0 ? (
        <AttendanceRosterForm roster={roster} onSubmit={submitRoster} />
      ) : (
        <div className="flex flex-col gap-4">
          <AttendanceTable
            records={existing}
            hasPendingCorrection={(id) => corrections.some((c) => c.attendanceId === id && c.status === "PENDING")}
            onRequestCorrection={setCorrectionTarget}
          />
          <PendingCorrections corrections={dayCorrections} records={records} onDecide={decideCorrection} />
        </div>
      )}

      <CorrectionDialog
        record={correctionTarget}
        studentName={correctionTarget ? getSectionRoster(correctionTarget.sectionId).find((s) => s.id === correctionTarget.studentId)?.fullName ?? "" : ""}
        onOpenChange={(open) => !open && setCorrectionTarget(null)}
        onSubmit={requestCorrection}
      />
    </div>
  );
}
