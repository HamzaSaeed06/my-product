"use client";

import { QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// staff_attendance.qr_manage is its own permission, separate from .view —
// this token is meant to be displayed/printed at reception, so gating it
// matters more than a plain read.
export function QrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Campus check-in QR code</DialogTitle>
          <DialogDescription>Display or print this at the campus entrance — staff scan it to check in.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center rounded-[var(--card-radius)] border border-border bg-muted/40 py-10">
          <QrCode className="size-32 text-foreground" strokeWidth={1} />
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
