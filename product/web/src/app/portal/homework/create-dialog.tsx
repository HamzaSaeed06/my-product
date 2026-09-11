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
import { createPortalHomework } from "./actions";

// Simpler than the admin CreateHomeworkDialog on purpose — a Teacher here
// only ever has one class context at a time (their primary assignment),
// so section/subject/teacher are hidden fields instead of pickers.
export function CreatePortalHomeworkDialog({
  sectionId,
  classId,
  subjectId,
  teacherId,
}: {
  sectionId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPortalHomework(formData);
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
      <DialogTrigger render={<Button size="sm" />}>+ Assign homework</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign homework</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="sectionId" value={sectionId} />
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <input type="hidden" name="teacherId" value={teacherId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-title">Title</Label>
            <Input id="hw-title" name="title" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-description">Description (optional)</Label>
            <Input id="hw-description" name="description" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-due">Due date</Label>
            <Input id="hw-due" name="dueDate" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-file">Attachment (optional)</Label>
            <Input id="hw-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
