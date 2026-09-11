"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPaymentGateway } from "./actions";

export function CreateGatewayDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPaymentGateway(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSecret(result.webhookSecret ?? null);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSecret(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>+ Add gateway</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add payment gateway</DialogTitle>
          {!secret ? (
            <DialogDescription>The webhook secret is shown once, right after creation — copy it then.</DialogDescription>
          ) : null}
        </DialogHeader>

        {secret ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-foreground">Gateway created. Copy this webhook secret now — it won&apos;t be shown again:</p>
            <code className="rounded-md border border-border bg-muted p-3 text-xs break-all">{secret}</code>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gw-provider">Provider</Label>
              <Select name="provider" defaultValue="SIMULATED">
                <SelectTrigger id="gw-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMULATED">Simulated</SelectItem>
                  <SelectItem value="EASYPAISA">Easypaisa</SelectItem>
                  <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="gw-name">Display name</Label>
              <Input id="gw-name" name="name" required placeholder="e.g. Easypaisa (Production)" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
