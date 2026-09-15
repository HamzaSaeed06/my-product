"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignTicket, resolveTicket, closeTicket } from "./actions";

export function TicketActions({
  ticketId,
  subject,
  status,
  currentUserId,
  assignedToId,
}: {
  ticketId: string;
  subject: string;
  status: string;
  currentUserId: string;
  assignedToId: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  if (status === "CLOSED") {
    return <p className="text-xs text-muted-foreground">Closed</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        {assignedToId !== currentUserId ? (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Assign "${subject}" to me`}
            onClick={() => run(() => assignTicket(ticketId, currentUserId))}
            disabled={isPending}
          >
            Assign to me
          </Button>
        ) : null}
        {status !== "RESOLVED" ? (
          <Button
            size="sm"
            variant="outline"
            aria-label={`Resolve "${subject}"`}
            onClick={() => run(() => resolveTicket(ticketId))}
            disabled={isPending}
          >
            Resolve
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Close "${subject}"`}
          onClick={() => run(() => closeTicket(ticketId))}
          disabled={isPending}
        >
          Close
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
