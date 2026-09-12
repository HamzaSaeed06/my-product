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
import { generateLicense } from "./actions";

interface CustomerOption {
  id: string;
  name: string;
  customerCode: string;
}
interface PlanOption {
  id: string;
  name: string;
}
interface DeploymentOption {
  id: string;
  customerId: string;
  url: string;
}

export function GenerateLicenseDialog({
  customers,
  plans,
  deployments,
}: {
  customers: CustomerOption[];
  plans: PlanOption[];
  deployments: DeploymentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedJwt, setSignedJwt] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const deploymentsForCustomer = deployments.filter((d) => d.customerId === customerId);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await generateLicense(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSignedJwt(result.signedJwt ?? null);
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setSignedJwt(null);
      setCustomerId("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>+ Generate license</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate a license</DialogTitle>
          {!signedJwt ? (
            <DialogDescription>The signed license token is shown once, right after creation — copy it then.</DialogDescription>
          ) : null}
        </DialogHeader>

        {signedJwt ? (
          <div className="flex flex-col gap-4">
            <SecretReveal
              label="License token"
              envVarName="LICENSE_JWT"
              value={signedJwt}
              helpText="License generated. Copy this token now and set it as the customer's LICENSE_JWT — it won't be shown again."
            />
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lic-customer">Customer</Label>
              <input type="hidden" name="customerId" value={customerId} />
              <Select onValueChange={(v) => typeof v === "string" && setCustomerId(v)}>
                <SelectTrigger id="lic-customer" className="w-full">
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
              <Label htmlFor="lic-deployment">Deployment</Label>
              <Select name="deploymentId" disabled={!customerId || deploymentsForCustomer.length === 0}>
                <SelectTrigger id="lic-deployment" className="w-full">
                  <SelectValue placeholder={customerId && deploymentsForCustomer.length === 0 ? "No deployments for this customer" : "Select a deployment"} />
                </SelectTrigger>
                <SelectContent>
                  {deploymentsForCustomer.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lic-plan">Plan</Label>
              <Select name="planId">
                <SelectTrigger id="lic-plan" className="w-full">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lic-expires">Valid for (days)</Label>
              <Input id="lic-expires" name="expiresInDays" type="number" min={1} required defaultValue={365} />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="submit" disabled={isPending || !customerId}>
                {isPending ? "Generating…" : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
