"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { initiateOnlinePayment } from "./actions";

export function PayOnlineButton({ invoiceId, amount }: { invoiceId: string; amount: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await initiateOnlinePayment(invoiceId, amount);
      // A successful call redirects server-side and never returns here.
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Starting…" : "Pay Online"}
      </Button>
      {error ? <p className="max-w-40 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
