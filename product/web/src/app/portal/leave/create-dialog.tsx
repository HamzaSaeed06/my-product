"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { requestPortalLeave } from "./actions";

export function RequestPortalLeaveDialog({
  subjectType,
  subjectId,
  triggerLabel,
  title,
}: {
  subjectType: "STUDENT" | "TEACHER";
  subjectId: string;
  triggerLabel: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestPortalLeave(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setError(null);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>{triggerLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="subjectType" value={subjectType} />
          <input type="hidden" name={subjectType === "STUDENT" ? "studentId" : "teacherId"} value={subjectId} />
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="leave-from">From</Label>
              <Input id="leave-from" name="fromDate" type="date" required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="leave-to">To</Label>
              <Input id="leave-to" name="toDate" type="date" required />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="leave-reason">Reason</Label>
            <Input id="leave-reason" name="reason" required placeholder="e.g. Fever" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
