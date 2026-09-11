"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPortalComplaint } from "./actions";

export function CreatePortalComplaintDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPortalComplaint(formData);
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
      <DialogTrigger render={<Button size="sm" />}>+ Submit complaint</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a complaint</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="studentId" value={studentId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="complaint-category">Category</Label>
            <Input id="complaint-category" name="category" required placeholder="e.g. Bullying, Facilities" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="complaint-description">Description</Label>
            <Textarea id="complaint-description" name="description" required rows={4} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
