"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/combobox";
import { mockStudents, type Student } from "@/lib/mock/students";
import { mockInvoices } from "@/lib/mock/invoices";
import type { PaymentMethod } from "@/lib/mock/payments";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

const METHOD_LABEL: Record<PaymentMethod, string> = { CASH: "Cash", ONLINE: "Online" };

export function RecordPaymentSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Student[] | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const invoiceOptions = student
    ? mockInvoices
        .filter((i) => i.studentId === student.id && (i.status === "UNPAID" || i.status === "PARTIALLY_PAID"))
        .map((i) => ({ value: i.id, label: `${i.invoiceNumber} — Rs ${i.totalAmount.toLocaleString()}` }))
    : [];
  const selectedInvoice = mockInvoices.find((i) => i.id === invoiceId);
  const exceedsInvoice = selectedInvoice && Number(amount) > selectedInvoice.totalAmount;

  function runSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setSearching(true);
    setTimeout(() => {
      setResults(mockStudents.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.includes(query.trim())));
      setSearching(false);
    }, 400);
  }

  function reset() {
    setQuery("");
    setResults(null);
    setStudent(null);
    setInvoiceId(null);
    setAmount("");
    setMethod("CASH");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Record a payment</SheetTitle>
          <SheetDescription>Any amount beyond the selected invoice&apos;s total is held as credit, not auto-refunded.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
          {student ? (
            <div className="flex items-center gap-3 rounded-[var(--card-radius)] border border-border p-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground">{initials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{student.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">{student.admissionNo}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setStudent(null);
                  setInvoiceId(null);
                }}
                aria-label="Change student"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="pay-search">Student</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="pay-search"
                    placeholder="Search name or admission no."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                  />
                  <Button variant="outline" size="icon" onClick={runSearch} disabled={!query.trim() || searching} aria-label="Search">
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  </Button>
                </div>
              </Field>
              {results ? (
                results.length ? (
                  <div className="flex max-h-40 flex-col divide-y divide-border overflow-y-auto rounded-[var(--card-radius)] border border-border">
                    {results.map((s) => (
                      <button key={s.id} type="button" className="flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => setStudent(s)}>
                        <span className="font-medium text-foreground">{s.fullName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{s.admissionNo}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No matching students found.</p>
                )
              ) : null}
            </>
          )}

          {student && (
            <Field>
              <FieldLabel>Invoice</FieldLabel>
              <Combobox
                options={invoiceOptions}
                value={invoiceId}
                onChange={setInvoiceId}
                placeholder={invoiceOptions.length ? "Select an invoice" : "No unpaid invoices"}
              />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pay-amount">Amount (Rs)</FieldLabel>
              <Input id="pay-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Method</FieldLabel>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => METHOD_LABEL[v as PaymentMethod]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {exceedsInvoice && (
            <p className="text-xs text-muted-foreground">
              This exceeds the invoice total by Rs {(Number(amount) - selectedInvoice!.totalAmount).toLocaleString()} — the excess is held as credit for a future invoice.
            </p>
          )}
        </div>
        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border pt-4">
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            disabled={!student || !invoiceId || !amount}
            onClick={() => {
              onOpenChange(false);
              toast.success(`Payment of Rs ${Number(amount).toLocaleString()} recorded.`);
              reset();
            }}
          >
            Record payment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
