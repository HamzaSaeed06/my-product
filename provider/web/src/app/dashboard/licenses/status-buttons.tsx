"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activateLicense, suspendLicense, revokeLicense } from "./actions";

export function LicenseStatusButtons({ licenseId, status }: { licenseId: string; status: "ACTIVE" | "SUSPENDED" | "REVOKED" }) {
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
          <Button size="sm" variant="outline" onClick={() => run(activateLicense)} disabled={isPending}>
            Reactivate
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => run(suspendLicense)} disabled={isPending}>
            Suspend
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={() => run(revokeLicense)} disabled={isPending}>
          Revoke
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
