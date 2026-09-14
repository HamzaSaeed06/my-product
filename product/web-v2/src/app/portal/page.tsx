"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getStudentById } from "@/lib/mock/students";
import { mockAppUsers } from "@/lib/mock/app-users";
import { mockSections } from "@/lib/mock/sections";
import { mockClasses } from "@/lib/mock/classes";
import { mockAttendance } from "@/lib/mock/attendance";
import { mockHomework } from "@/lib/mock/homework";
import { mockInvoices } from "@/lib/mock/invoices";
import { mockResults } from "@/lib/mock/results";
import { PORTAL_DEMO } from "@/lib/mock/portal-session";
import { usePortal } from "./portal-context";

function sectionLabel(sectionId: string) {
  const section = mockSections.find((s) => s.id === sectionId);
  const className = section ? mockClasses.find((c) => c.id === section.classId)?.name : "";
  return section ? `${className} ${section.name}` : sectionId;
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-ring flex flex-col gap-1 rounded-[var(--card-radius)] p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xl font-semibold text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function PortalOverviewPage() {
  const { role, activeChildId } = usePortal();

  if (role === "TEACHER") {
    const teacherName = mockAppUsers.find((u) => u.id === PORTAL_DEMO.teacherUserId)?.fullName;
    const sectionRecords = mockAttendance.filter((a) => a.sectionId === PORTAL_DEMO.teacherSectionId);
    const draftHomework = mockHomework.filter((h) => h.teacherId === PORTAL_DEMO.teacherId && h.status === "DRAFT").length;

    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Welcome, ${teacherName}`} description={`${sectionLabel(PORTAL_DEMO.teacherSectionId)} · your primary section`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile label="Section" value={sectionLabel(PORTAL_DEMO.teacherSectionId)} />
          <Tile label="Attendance marked" value={sectionRecords.length > 0 ? "Today" : "Not yet"} hint="Tap Attendance to mark" />
          <Tile label="Draft homework" value={String(draftHomework)} hint="Not yet published" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/portal/attendance" className="surface-ring rounded-[var(--card-radius)] px-4 py-2 text-sm text-foreground hover:bg-accent">
            Mark today&apos;s attendance
          </Link>
          <Link href="/portal/homework" className="surface-ring rounded-[var(--card-radius)] px-4 py-2 text-sm text-foreground hover:bg-accent">
            Assign homework
          </Link>
        </div>
      </div>
    );
  }

  const student = getStudentById(activeChildId);
  const attendanceRecords = mockAttendance.filter((a) => a.studentId === activeChildId);
  const attendancePct = attendanceRecords.length ? Math.round((attendanceRecords.filter((a) => a.status === "PRESENT").length / attendanceRecords.length) * 100) : null;
  const invoices = mockInvoices.filter((i) => i.studentId === activeChildId && i.status !== "VOID" && i.status !== "PAID");
  const latestResult = mockResults.filter((r) => r.studentId === activeChildId).sort((a, b) => b.id.localeCompare(a.id))[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={role === "PARENT" ? "Welcome back" : `Welcome, ${student?.fullName}`} description={role === "PARENT" ? `Viewing ${student?.fullName}'s profile` : student?.admissionNo} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile label="Attendance" value={attendancePct !== null ? `${attendancePct}%` : "—"} />
        <Tile label="Unpaid invoices" value={String(invoices.length)} hint={role === "STUDENT" ? "Ask your parent" : undefined} />
        <Tile label="Latest result" value={latestResult ? latestResult.status.charAt(0) + latestResult.status.slice(1).toLowerCase() : "—"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/portal/homework" className="surface-ring rounded-[var(--card-radius)] px-4 py-2 text-sm text-foreground hover:bg-accent">
          View homework
        </Link>
        <Link href="/portal/timetable" className="surface-ring rounded-[var(--card-radius)] px-4 py-2 text-sm text-foreground hover:bg-accent">
          View timetable
        </Link>
      </div>
    </div>
  );
}
