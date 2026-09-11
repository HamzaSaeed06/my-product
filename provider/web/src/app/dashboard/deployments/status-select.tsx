"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setDeploymentStatus } from "./actions";

const STATUSES = ["PROVISIONING", "ACTIVE", "SUSPENDED", "DECOMMISSIONED"] as const;

export function DeploymentStatusSelect({ deploymentId, status }: { deploymentId: string; status: string }) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(value: unknown) {
    if (typeof value !== "string") return;
    startTransition(async () => {
      const result = await setDeploymentStatus(deploymentId, value as (typeof STATUSES)[number]);
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
      <Select value={status} onValueChange={handleChange}>
        <SelectTrigger className="w-40">
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
    </div>
  );
}
