"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { activateLicense, suspendLicense, revokeLicense } from "./actions";

export function LicenseStatusButtons({
  licenseId,
  licenseNumber,
  status,
}: {
  licenseId: string;
  licenseNumber: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: (id: string) => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const result = await action(licenseId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  if (status === "REVOKED") {
    return <p className="text-right text-xs text-muted-foreground">Revoked — terminal</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        {status === "SUSPENDED" ? (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Reactivate license ${licenseNumber}`}
            onClick={() => run(activateLicense)}
            disabled={isPending}
          >
            Reactivate
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Suspend license ${licenseNumber}`}
            onClick={() => run(suspendLicense)}
            disabled={isPending}
          >
            Suspend
          </Button>
        )}
        <ConfirmActionButton
          label="Revoke"
          ariaLabel={`Revoke license ${licenseNumber}`}
          confirmTitle={`Revoke license ${licenseNumber}?`}
          confirmDescription="This is terminal — a revoked license cannot be reactivated or suspended again. The customer's deployment will stop validating against it immediately."
          destructive
          action={() => revokeLicense(licenseId)}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
