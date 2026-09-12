"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// A one-time secret (heartbeat token / license JWT) is never fetchable again
// after this render — the API only returns it on the create/generate call
// itself, never on a later read. This is the only chance to copy it.
export function SecretReveal({
  label,
  envVarName,
  value,
  helpText,
}: {
  label: string;
  envVarName: string;
  value: string;
  helpText: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically — select the text and copy it manually");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>Shown only once</AlertTitle>
        <AlertDescription>{helpText}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Set as <code className="rounded bg-muted px-1 py-0.5">{envVarName}</code>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 shrink-0 gap-1.5 px-2 text-xs"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/50 p-3">
          <code className="text-xs break-all text-foreground">{value}</code>
        </div>
      </div>
    </div>
  );
}
