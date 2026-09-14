"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QrCode, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockStaffAttendance, TODAY, type StaffAttendanceRecord } from "@/lib/mock/staff-attendance";
import { staffAttendanceColumns } from "./columns";
import { MarkDialog } from "./mark-dialog";
import { QrDialog } from "./qr-dialog";

export default function StaffAttendancePage() {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>(mockStaffAttendance);
  const [markOpen, setMarkOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const today = records.filter((r) => r.date === TODAY);

  function markManually(userId: string) {
    setRecords((prev) => [
      ...prev,
      {
        id: `sa_${Date.now()}`,
        userId,
        campusId: "cmp_main",
        date: TODAY,
        checkInAt: new Date().toISOString(),
        checkInMethod: "MANUAL",
        verifiedStatus: "MANUAL_OVERRIDE",
        ipAddress: null,
        geoLat: null,
        geoLng: null,
        markedById: "usr_incharge_1",
      },
    ]);
    toast.success("Marked present.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff Attendance"
        description="Check-in verification for every staff member (Teacher, Incharge, Office) — separate from Teacher Attendance's simple present/absent/leave mark."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
              <QrCode className="size-3.5" />
              Show QR code
            </Button>
            <Button size="sm" onClick={() => setMarkOpen(true)}>
              <UserPlus className="size-3.5" />
              Mark manually
            </Button>
          </>
        }
      />
      <DataTable
        columns={staffAttendanceColumns}
        data={today}
        emptyTitle="No check-ins yet today"
        emptyDescription="Staff check in by scanning the campus QR code, or mark one manually."
      />
      <MarkDialog open={markOpen} onOpenChange={setMarkOpen} alreadyMarked={today} onMark={markManually} />
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
