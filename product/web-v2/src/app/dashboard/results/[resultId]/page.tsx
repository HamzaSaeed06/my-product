import { notFound } from "next/navigation";
import { mockResults } from "@/lib/mock/results";
import { ResultDetail } from "./result-detail";

export default async function ResultDetailPage({ params }: PageProps<"/dashboard/results/[resultId]">) {
  const { resultId } = await params;
  const result = mockResults.find((r) => r.id === resultId);
  if (!result) notFound();

  return <ResultDetail result={result} />;
}
