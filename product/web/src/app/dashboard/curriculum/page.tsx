import { apiRequest } from "@/lib/apiClient";
import { PageHeader } from "@/components/page-header";
import { CurriculumFilters } from "./filters";
import { CreateTopicDialog } from "./create-dialog";
import { ProgressToggle } from "./progress-toggle";
import { ArchiveTopicButton } from "./archive-button";

interface NamedOption {
  id: string;
  name: string;
}

interface RawSection {
  id: string;
  name: string;
  classId: string;
  academicYearId: string;
  archivedAt: string | null;
}

interface CurriculumTopic {
  id: string;
  topic: string;
  sortOrder: number;
  progress: { sectionId: string; completedAt: string | null; section: { name: string } }[];
}

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; academicYearId?: string }>;
}) {
  const { classId: requestedClassId, academicYearId: requestedYearId } = await searchParams;

  const [classes, academicYears, subjects, rawSections] = await Promise.all([
    apiRequest<NamedOption[]>("/api/v1/classes"),
    apiRequest<NamedOption[]>("/api/v1/academic-years"),
    apiRequest<NamedOption[]>("/api/v1/subjects"),
    apiRequest<RawSection[]>("/api/v1/sections"),
  ]);

  if (classes.length === 0 || academicYears.length === 0) {
    return (
      <div>
        <PageHeader title="Curriculum" description="Track syllabus topics and teaching progress per section." />
        <p className="text-sm text-muted-foreground">Create a class and an academic year first.</p>
      </div>
    );
  }

  const classId = classes.find((c) => c.id === requestedClassId)?.id ?? classes[0]!.id;
  const academicYearId = academicYears.find((y) => y.id === requestedYearId)?.id ?? academicYears[0]!.id;

  const sectionsInScope = rawSections.filter((s) => !s.archivedAt && s.classId === classId && s.academicYearId === academicYearId);

  const topics = await apiRequest<CurriculumTopic[]>(`/api/v1/curriculum?classId=${classId}&academicYearId=${academicYearId}`);

  return (
    <div>
      <PageHeader
        title="Curriculum"
        description="Track syllabus topics and teaching progress per section."
        action={<CreateTopicDialog classId={classId} academicYearId={academicYearId} subjects={subjects} />}
      />

      <CurriculumFilters classes={classes} academicYears={academicYears} selectedClassId={classId} selectedYearId={academicYearId} />

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground">No curriculum topics yet for this class/year.</p>
      ) : sectionsInScope.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections exist for this class/year yet — progress can&apos;t be tracked until one does.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((topic) => {
            const progressBySectionId = new Map(topic.progress.map((p) => [p.sectionId, p]));
            return (
              <div key={topic.id} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                  <ArchiveTopicButton id={topic.id} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {sectionsInScope.map((section) => {
                    const progress = progressBySectionId.get(section.id);
                    return (
                      <ProgressToggle
                        key={section.id}
                        curriculumId={topic.id}
                        sectionId={section.id}
                        sectionName={section.name}
                        completed={!!progress?.completedAt}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
