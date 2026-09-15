"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { setPlanActive } from "./actions";

export function PlanActiveToggle({ planId, planName, isActive }: { planId: string; planName: string; isActive: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function activate() {
    startTransition(async () => {
      const result = await setPlanActive(planId, true);
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
      {isActive ? (
        <ConfirmActionButton
          label="Deactivate"
          ariaLabel={`Deactivate plan ${planName}`}
          confirmTitle={`Deactivate ${planName}?`}
          confirmDescription="New licenses won't be able to select this plan until it's reactivated. Existing licenses on this plan are unaffected."
          destructive
          action={() => setPlanActive(planId, false)}
        />
      ) : (
        <Button size="sm" variant="outline" aria-label={`Activate plan ${planName}`} onClick={activate} disabled={isPending}>
          {isPending ? "…" : "Activate"}
        </Button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
