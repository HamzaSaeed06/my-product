"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionPicker, type SectionOption } from "@/components/section-picker";
import { createHomework } from "./actions";

interface NamedOption {
  id: string;
  name: string;
}

// Hand-rolled, not built on FormDialog — needs a real file input and goes
// through apiUpload (multipart), same reasoning as the student document
// upload dialog.
export function CreateHomeworkDialog({
  sections,
  subjects,
  teachers,
}: {
  sections: SectionOption[];
  subjects: NamedOption[];
  teachers: NamedOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const disabled = sections.length === 0 || subjects.length === 0 || teachers.length === 0;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createHomework(formData);
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
      <DialogTrigger render={<Button size="sm" />}>+ Add homework</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add homework</DialogTitle>
          {disabled ? <DialogDescription>Need at least one section, subject, and teacher first.</DialogDescription> : null}
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Section</Label>
            <SectionPicker sections={sections} emitAcademicYearId={false} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-subject">Subject</Label>
            <Select name="subjectId" disabled={disabled}>
              <SelectTrigger id="hw-subject" className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hw-teacher">Teacher</Label>
            <Select name="teacherId" disabled={disabled}>
              <SelectTrigger id="hw-teacher" className="w-full">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Button type="submit" disabled={isPending || disabled}>
              {isPending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
