"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setCustomerStatus } from "./actions";

export function CustomerStatusToggle({ customerId, status }: { customerId: string; status: "ACTIVE" | "INACTIVE" }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await setCustomerStatus(customerId, status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
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
      <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? "…" : status === "ACTIVE" ? "Deactivate" : "Activate"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
