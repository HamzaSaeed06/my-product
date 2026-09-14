import { notFound } from "next/navigation";
import { mockExams } from "@/lib/mock/exams";
import { ExamDetail } from "./exam-detail";

export default async function ExamDetailPage({ params }: PageProps<"/dashboard/exams/[examId]">) {
  const { examId } = await params;
  const exam = mockExams.find((e) => e.id === examId);
  if (!exam) notFound();

  return <ExamDetail exam={exam} />;
}
