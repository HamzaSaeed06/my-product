"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GatewayProvider } from "@/lib/mock/payment-gateways";

const PROVIDER_LABEL: Record<GatewayProvider, string> = { EASYPAISA: "Easypaisa", JAZZCASH: "JazzCash", SIMULATED: "Simulated" };

export function CreateGatewayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [provider, setProvider] = useState<GatewayProvider>("EASYPAISA");
  const [name, setName] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setName("");
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a payment gateway</DialogTitle>
          <DialogDescription>Only Simulated is actually wired up today — the others are configuration placeholders for when a real account is connected.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Provider</FieldLabel>
            <Select value={provider} onValueChange={(v) => setProvider(v as GatewayProvider)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v) => PROVIDER_LABEL[v as GatewayProvider]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROVIDER_LABEL) as GatewayProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PROVIDER_LABEL[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="pg-name">Display name</FieldLabel>
            <Input id="pg-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onOpenChange(false);
              toast.success("Gateway added, inactive by default.");
              setName("");
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
