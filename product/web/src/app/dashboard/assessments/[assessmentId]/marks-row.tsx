"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { enterMarks } from "./actions";

export function MarksRow({
  assessmentId,
  studentId,
  totalMarks,
  initialMarks,
  initialRemarks,
}: {
  assessmentId: string;
  studentId: string;
  totalMarks: number;
  initialMarks: number | null;
  initialRemarks: string | null;
}) {
  const [marks, setMarks] = useState(initialMarks?.toString() ?? "");
  const [remarks, setRemarks] = useState(initialRemarks ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await enterMarks(assessmentId, studentId, Number(marks), remarks || undefined);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        max={totalMarks}
        value={marks}
        onChange={(e) => setMarks(e.target.value)}
        className="w-20"
      />
      <Input
        placeholder="Remarks (optional)"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        className="w-48"
      />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={isPending || marks === ""}>
        {isPending ? "Saving…" : "Save"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
