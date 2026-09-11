"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { confirmOnlinePayment, cancelOnlinePayment } from "../../actions";

export function CheckoutActions({ gatewayTransactionId }: { gatewayTransactionId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handle(action: (id: string) => Promise<{ error?: string; outcome?: string }>) {
    startTransition(async () => {
      const result = await action(gatewayTransactionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setOutcome(result.outcome === "SUCCESS" ? "SUCCESS" : "FAILED");
    });
  }

  if (outcome === "SUCCESS") {
    return (
      <div className="mt-4 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Payment successful.</p>
        <p className="mt-1 text-xs text-muted-foreground">A receipt has been recorded against this invoice.</p>
        <Link href="/portal/fees" className="mt-3 inline-block">
          <Button size="sm">Back to Fees</Button>
        </Link>
      </div>
    );
  }

  if (outcome === "FAILED") {
    return (
      <div className="mt-4 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-destructive">Payment was not completed.</p>
        <p className="mt-1 text-xs text-muted-foreground">No amount was deducted. You can try again from Fees.</p>
        <Link href="/portal/fees" className="mt-3 inline-block">
          <Button size="sm" variant="outline">
            Back to Fees
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button onClick={() => handle(confirmOnlinePayment)} disabled={isPending}>
          {isPending ? "Processing…" : "Confirm Payment"}
        </Button>
        <Button variant="outline" onClick={() => handle(cancelOnlinePayment)} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
