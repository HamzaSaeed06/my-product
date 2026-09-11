import Link from "next/link";
import { apiRequest, ApiError } from "@/lib/apiClient";
import { CheckoutActions } from "./checkout-actions";

interface CheckoutDetails {
  id: string;
  amount: string;
  gatewayName: string;
  invoiceNumber: string;
  studentName: string;
}

export default async function PayOnlineCheckoutPage({
  params,
}: {
  params: Promise<{ gatewayTransactionId: string }>;
}) {
  const { gatewayTransactionId } = await params;

  let details: CheckoutDetails;
  try {
    details = await apiRequest<CheckoutDetails>(`/api/v1/online-payment/${gatewayTransactionId}`);
  } catch (err) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Pay Online</h1>
        <p className="mt-4 text-sm text-destructive">
          {err instanceof ApiError ? err.message : "This checkout session is no longer available."}
        </p>
        <Link href="/portal/fees" className="mt-4 inline-block text-sm text-foreground hover:underline">
          ← Back to Fees
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Pay Online</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Simulated {details.gatewayName} checkout — no real money is charged.
      </p>

      <div className="mt-4 rounded-lg border border-border p-4">
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Student</dt>
            <dd className="font-medium text-foreground">{details.studentName}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Invoice</dt>
            <dd className="font-mono text-foreground">{details.invoiceNumber}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="text-xl font-semibold text-foreground">{details.amount}</dd>
          </div>
        </dl>
      </div>

      <CheckoutActions gatewayTransactionId={details.id} />
    </div>
  );
}
