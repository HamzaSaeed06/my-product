import { notFound } from "next/navigation";
import { mockComplaints } from "@/lib/mock/complaints";
import { ComplaintDetail } from "./complaint-detail";

export default async function ComplaintDetailPage({ params }: PageProps<"/dashboard/complaints/[complaintId]">) {
  const { complaintId } = await params;
  const complaint = mockComplaints.find((c) => c.id === complaintId);
  if (!complaint) notFound();

  return <ComplaintDetail complaint={complaint} />;
}
