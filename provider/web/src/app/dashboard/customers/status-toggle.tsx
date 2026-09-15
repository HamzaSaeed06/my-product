"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { setCustomerStatus } from "./actions";

export function CustomerStatusToggle({
  customerId,
  customerName,
  status,
}: {
  customerId: string;
  customerName: string;
  status: "ACTIVE" | "INACTIVE";
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function activate() {
    startTransition(async () => {
      const result = await setCustomerStatus(customerId, "ACTIVE");
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {status === "ACTIVE" ? (
        <ConfirmActionButton
          label="Deactivate"
          ariaLabel={`Deactivate customer ${customerName}`}
          confirmTitle={`Deactivate ${customerName}?`}
          confirmDescription="Their deployments will stop validating against active licenses until this customer is reactivated."
          destructive
          action={() => setCustomerStatus(customerId, "INACTIVE")}
        />
      ) : (
        <Button size="sm" variant="outline" aria-label={`Activate customer ${customerName}`} onClick={activate} disabled={isPending}>
          {isPending ? "…" : "Activate"}
        </Button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
