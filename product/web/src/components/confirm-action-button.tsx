"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmActionButtonProps {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  destructive?: boolean;
  action: () => Promise<{ error?: string } | void>;
  /** Accessible name for the trigger button — set this whenever the same
   * label repeats across multiple rows in a table, so a screen reader
   * announces which row the control acts on. */
  ariaLabel?: string;
}

// Shared by every "archive / close / revoke" control across the Phase 1
// screens (Campuses, Classes, Sections, Academic Years, Incharge Scopes) —
// same confirm-then-mutate-then-refresh shape each time, so one component
// earns its place instead of five near-identical dialogs.
export function ConfirmActionButton({
  label,
  confirmTitle,
  confirmDescription,
  destructive = false,
  action,
  ariaLabel,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setOpen(false);
      setError(null);
      toast.success("Done");
      router.refresh();
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger
        render={<Button variant={destructive ? "destructive" : "outline"} size="sm" aria-label={ariaLabel} />}
      >
        {label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Working…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
