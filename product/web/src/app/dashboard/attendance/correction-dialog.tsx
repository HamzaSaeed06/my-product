"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { requestAttendanceCorrection } from "./actions";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LEAVE"] as const;

export function RequestCorrectionDialog({ attendanceId, currentStatus }: { attendanceId: string; currentStatus: string }) {
  return (
    <FormDialog
      triggerLabel="Request correction"
      title="Request an attendance correction"
      description={`Currently marked: ${currentStatus[0]}${currentStatus.slice(1).toLowerCase()}. An Incharge must approve this change.`}
      action={(formData) => requestAttendanceCorrection(attendanceId, formData)}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`new-status-${attendanceId}`}>Correct status</Label>
        <Select name="newStatus" defaultValue={currentStatus}>
          <SelectTrigger id={`new-status-${attendanceId}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status[0]}
                {status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`reason-${attendanceId}`}>Reason</Label>
        <Input id={`reason-${attendanceId}`} name="reason" required />
      </div>
    </FormDialog>
  );
}
