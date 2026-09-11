"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleCurriculumProgress } from "./actions";

export function ProgressToggle({
  curriculumId,
  sectionId,
  sectionName,
  completed,
}: {
  curriculumId: string;
  sectionId: string;
  sectionName: string;
  completed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await toggleCurriculumProgress(curriculumId, sectionId, !completed);
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant={completed ? "default" : "outline"}
      onClick={handleClick}
      disabled={isPending}
    >
      {sectionName}: {completed ? "Done" : "Pending"}
    </Button>
  );
}
