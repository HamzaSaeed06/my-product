import { notFound } from "next/navigation";
import { mockInvoices } from "@/lib/mock/invoices";
import { InvoiceDetail } from "./invoice-detail";

export default async function InvoiceDetailPage({ params }: PageProps<"/dashboard/invoices/[invoiceId]">) {
  const { invoiceId } = await params;
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  if (!invoice) notFound();

  return <InvoiceDetail invoice={invoice} />;
}
