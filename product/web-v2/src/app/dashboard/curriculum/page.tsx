"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/combobox";
import { mockClasses } from "@/lib/mock/classes";
import { mockSections } from "@/lib/mock/sections";
import { mockCurriculumTopics, mockCurriculumProgress, type CurriculumTopic, type CurriculumProgress } from "@/lib/mock/curriculum";
import { TopicCard } from "./topic-card";
import { AddTopicDialog } from "./add-topic-dialog";

const CLASS_OPTIONS = mockClasses.filter((c) => !c.archived).map((c) => ({ value: c.id, label: c.name }));
const ACADEMIC_YEAR_ID = "ay_2026";

export default function CurriculumPage() {
  const [classId, setClassId] = useState<string | null>("cls_3");
  const [topics, setTopics] = useState<CurriculumTopic[]>(mockCurriculumTopics);
  const [progress, setProgress] = useState<CurriculumProgress[]>(mockCurriculumProgress);
  const [addOpen, setAddOpen] = useState(false);

  const sections = mockSections.filter((s) => s.classId === classId && s.academicYearId === ACADEMIC_YEAR_ID && !s.archived);
  const classTopics = topics
    .filter((t) => t.classId === classId && t.academicYearId === ACADEMIC_YEAR_ID && !t.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function addTopic(topicName: string, subjectId: string, expectedCompletionDate: string | null) {
    if (!classId) return;
    const id = `cur_${Date.now()}`;
    setTopics((prev) => [
      ...prev,
      { id, subjectId, classId, academicYearId: ACADEMIC_YEAR_ID, topic: topicName, sortOrder: prev.length + 1, expectedCompletionDate, archivedAt: null },
    ]);
    setProgress((prev) => [
      ...prev,
      ...sections.map((section) => ({ id: `cp_${id}_${section.id}`, curriculumId: id, sectionId: section.id, completedAt: null, completedById: null, notes: null })),
    ]);
    toast.success("Topic added.");
  }

  function toggleProgress(progressId: string) {
    setProgress((prev) =>
      prev.map((p) => (p.id === progressId ? { ...p, completedAt: p.completedAt ? null : new Date().toISOString(), completedById: p.completedAt ? null : "tch_1" } : p)),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Curriculum"
        description="One syllabus per class, shared across its sections — completion is tracked per section by tapping its chip below each topic."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            Add topic
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Class</span>
        <Combobox options={CLASS_OPTIONS} value={classId} onChange={setClassId} placeholder="Select a class" className="w-56" />
      </div>

      {classTopics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No syllabus topics yet for this class.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {classTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} sections={sections} progress={progress} onToggle={toggleProgress} />
          ))}
        </div>
      )}

      <AddTopicDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addTopic} />
    </div>
  );
}
