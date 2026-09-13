import { notFound } from "next/navigation";
import { mockAdmissionInquiries } from "@/lib/mock/admission-inquiries";
import { ConvertInquiryFlow } from "./convert-inquiry-flow";

export default async function ConvertInquiryPage({ params }: PageProps<"/dashboard/admission-inquiries/[inquiryId]/convert">) {
  const { inquiryId } = await params;
  const inquiry = mockAdmissionInquiries.find((i) => i.id === inquiryId);
  if (!inquiry) notFound();

  return <ConvertInquiryFlow inquiry={inquiry} />;
}
