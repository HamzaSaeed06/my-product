"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Shared error boundary for everything under /dashboard — without this,
// any backend hiccup or a bad [id] in a route param (e.g. a stale
// customer/deployment/license link) fell through to Next's raw unstyled
// crash screen. Renders inside the dashboard layout's <main>, so the header
// and sidebar stay usable — the user isn't fully stranded.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            This page hit an unexpected error. It could be a temporary backend issue, or a stale link to a
            record that no longer exists.
          </p>
        </div>
        <Alert variant="destructive" className="text-left">
          <AlertTitle>Error detail</AlertTitle>
          <AlertDescription className="font-mono text-xs break-words">
            {error.message || "Unknown error"}
            {error.digest ? ` (ref: ${error.digest})` : null}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reset()}>
            Try again
          </Button>
          <Button nativeButton={false} render={<Link href="/dashboard">Back to dashboard</Link>} />
        </div>
      </div>
    </div>
  );
}
