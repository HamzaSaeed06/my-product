"use client";

import { cn } from "@/lib/utils";
import { mockSubjects } from "@/lib/mock/subjects";
import type { CurriculumProgress, CurriculumTopic } from "@/lib/mock/curriculum";
import type { Section } from "@/lib/mock/sections";

export function TopicCard({
  topic,
  sections,
  progress,
  onToggle,
}: {
  topic: CurriculumTopic;
  sections: Section[];
  progress: CurriculumProgress[];
  onToggle: (progressId: string) => void;
}) {
  const subject = mockSubjects.find((s) => s.id === topic.subjectId);

  return (
    <div className="surface-ring flex flex-col gap-3 rounded-[var(--card-radius)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{topic.topic}</span>
          <span className="text-xs text-muted-foreground">
            {subject?.name}
            {topic.expectedCompletionDate ? ` · Expected by ${topic.expectedCompletionDate}` : ""}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sections.map((section) => {
          const entry = progress.find((p) => p.curriculumId === topic.id && p.sectionId === section.id);
          const done = !!entry?.completedAt;
          return (
            <button
              key={section.id}
              type="button"
              disabled={!entry}
              onClick={() => entry && onToggle(entry.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                done
                  ? "border-transparent bg-success/15 text-success hover:bg-success/25"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
              title={done ? `Completed for Section ${section.name}` : `Pending for Section ${section.name}`}
            >
              {section.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
