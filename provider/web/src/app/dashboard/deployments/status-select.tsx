"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { setDeploymentStatus } from "./actions";

const STATUSES = ["PROVISIONING", "ACTIVE", "SUSPENDED", "DECOMMISSIONED"] as const;

// DECOMMISSIONED is terminal — there's no status to move back to once set —
// so it gets a confirmation step instead of applying on select like the
// other (reversible) transitions.
export function DeploymentStatusSelect({
  deploymentId,
  url,
  status,
}: {
  deploymentId: string;
  url: string;
  status: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  function apply(value: (typeof STATUSES)[number]) {
    startTransition(async () => {
      const result = await setDeploymentStatus(deploymentId, value);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  function handleChange(value: unknown) {
    if (typeof value !== "string") return;
    if (value === "DECOMMISSIONED") {
      setConfirmOpen(true);
      return;
    }
    apply(value as (typeof STATUSES)[number]);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="w-40" aria-label={`Status for deployment ${url}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decommission {url}?</AlertDialogTitle>
            <AlertDialogDescription>
              This is terminal — there is no status to move this deployment back to once it&apos;s decommissioned.
              Its heartbeat and license checks will stop being tracked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                apply("DECOMMISSIONED");
                setConfirmOpen(false);
              }}
            >
              {isPending ? "Working…" : "Decommission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
