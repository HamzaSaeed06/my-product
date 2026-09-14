import { notFound } from "next/navigation";
import { mockAssessments } from "@/lib/mock/assessments";
import { AssessmentDetail } from "./assessment-detail";

export default async function AssessmentDetailPage({ params }: PageProps<"/dashboard/assessments/[assessmentId]">) {
  const { assessmentId } = await params;
  const assessment = mockAssessments.find((a) => a.id === assessmentId);
  if (!assessment) notFound();

  return <AssessmentDetail assessment={assessment} />;
}
