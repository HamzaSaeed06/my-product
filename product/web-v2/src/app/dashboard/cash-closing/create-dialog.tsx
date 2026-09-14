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
import { Combobox } from "@/components/combobox";
import { mockCampuses } from "@/lib/mock/campuses";

const CAMPUS_OPTIONS = mockCampuses.map((c) => ({ value: c.id, label: c.name }));

export function CreateClosingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [campusId, setCampusId] = useState<string | null>("cmp_main");
  const [date, setDate] = useState("2026-09-14");
  const [openingBalance, setOpeningBalance] = useState("");
  const [collections, setCollections] = useState("");
  const [refundsPaidOut, setRefundsPaidOut] = useState("0");
  const [actualBalance, setActualBalance] = useState("");

  const expected = (Number(openingBalance) || 0) + (Number(collections) || 0) - (Number(refundsPaidOut) || 0);
  const variance = (Number(actualBalance) || 0) - expected;

  function reset() {
    setCampusId("cmp_main");
    setDate("2026-09-14");
    setOpeningBalance("");
    setCollections("");
    setRefundsPaidOut("0");
    setActualBalance("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close today&apos;s cash</DialogTitle>
          <DialogDescription>One closing per campus per day — a single record-and-confirm action, not an editable list.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Campus</FieldLabel>
              <Combobox options={CAMPUS_OPTIONS} value={campusId} onChange={setCampusId} placeholder="Select" />
            </Field>
            <Field>
              <FieldLabel htmlFor="cc-date">Date</FieldLabel>
              <Input id="cc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="cc-opening">Opening balance</FieldLabel>
              <Input id="cc-opening" type="number" min={0} value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cc-collections">Cash collections</FieldLabel>
              <Input id="cc-collections" type="number" min={0} value={collections} onChange={(e) => setCollections(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="cc-refunds">Refunds paid out</FieldLabel>
              <Input id="cc-refunds" type="number" min={0} value={refundsPaidOut} onChange={(e) => setRefundsPaidOut(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="cc-actual">Actual balance (counted)</FieldLabel>
              <Input id="cc-actual" type="number" min={0} value={actualBalance} onChange={(e) => setActualBalance(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-[var(--card-radius)] bg-muted/40 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Expected</span>
              <span className="font-mono text-sm text-foreground">Rs {expected.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Variance</span>
              <span className={`font-mono text-sm ${variance === 0 ? "text-foreground" : variance > 0 ? "text-success" : "text-destructive"}`}>
                {variance >= 0 ? "+" : ""}
                {variance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={!campusId || !openingBalance || !collections || !actualBalance}
            onClick={() => {
              onOpenChange(false);
              toast.success("Cash closing recorded, awaiting approval.");
              reset();
            }}
          >
            Close cash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
