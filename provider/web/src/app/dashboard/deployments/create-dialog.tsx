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
import { SecretReveal } from "@/components/secret-reveal";
import { createDeployment } from "./actions";

interface CustomerOption {
  id: string;
  name: string;
  customerCode: string;
}

export function CreateDeploymentDialog({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heartbeatToken, setHeartbeatToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createDeployment(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setHeartbeatToken(result.heartbeatToken ?? null);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setHeartbeatToken(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>+ Add deployment</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a deployment</DialogTitle>
          {!heartbeatToken ? (
            <DialogDescription>The heartbeat token is shown once, right after creation — copy it then.</DialogDescription>
          ) : null}
        </DialogHeader>

        {heartbeatToken ? (
          <div className="flex flex-col gap-4">
            <SecretReveal
              label="Heartbeat token"
              envVarName="DEPLOYMENT_HEARTBEAT_TOKEN"
              value={heartbeatToken}
              helpText="Deployment created. Copy this token now and set it as the customer's DEPLOYMENT_HEARTBEAT_TOKEN — it won't be shown again."
            />
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deploy-customer">Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger id="deploy-customer" className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deploy-version">Version</Label>
              <Input id="deploy-version" name="version" required placeholder="e.g. 1.0.0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deploy-url">Deployment URL</Label>
              <Input id="deploy-url" name="url" type="url" required placeholder="https://customer-school.edu.pk" />
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
