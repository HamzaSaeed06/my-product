import { notFound } from "next/navigation";
import { mockReportCards } from "@/lib/mock/report-cards";
import { ReportCardView } from "./report-card-view";

export default async function ReportCardDetailPage({ params }: PageProps<"/dashboard/report-cards/[reportCardId]">) {
  const { reportCardId } = await params;
  const reportCard = mockReportCards.find((rc) => rc.id === reportCardId);
  if (!reportCard) notFound();

  return <ReportCardView reportCard={reportCard} />;
}
