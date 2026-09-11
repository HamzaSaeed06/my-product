"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/form-dialog";
import { recordPayment } from "./actions";

interface StudentOption {
  id: string;
  fullName: string;
  studentCode: string;
}
interface InvoiceOption {
  id: string;
  studentId: string;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
}
interface CreditOption {
  id: string;
  studentId: string;
  transactionNumber: string;
  amount: string;
  status: string;
}

export function RecordPaymentDialog({
  students,
  invoices,
  credits,
}: {
  students: StudentOption[];
  invoices: InvoiceOption[];
  credits: CreditOption[];
}) {
  const [studentId, setStudentId] = useState<string>("");
  const disabled = students.length === 0;

  const payableInvoices = invoices.filter((i) => i.studentId === studentId && (i.status === "UNPAID" || i.status === "PARTIALLY_PAID"));
  const availableCredits = credits.filter((c) => c.studentId === studentId && c.status === "AVAILABLE");

  return (
    <FormDialog
      triggerLabel="+ Record payment"
      title="Record a payment"
      description={disabled ? "Need at least one student first." : undefined}
      action={recordPayment}
    >
      <input type="hidden" name="studentId" value={studentId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="pay-student">Student</Label>
        <Select
          disabled={disabled}
          onValueChange={(v: unknown) => {
            if (typeof v === "string") setStudentId(v);
          }}
        >
          <SelectTrigger id="pay-student" className="w-full">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pay-invoice">Invoice</Label>
        <Select name="invoiceId" disabled={!studentId || payableInvoices.length === 0}>
          <SelectTrigger id="pay-invoice" className="w-full">
            <SelectValue placeholder={studentId && payableInvoices.length === 0 ? "No payable invoices" : "Select an invoice"} />
          </SelectTrigger>
          <SelectContent>
            {payableInvoices.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.invoiceNumber} · {i.totalAmount}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pay-amount">Amount</Label>
        <Input id="pay-amount" name="amount" required placeholder="e.g. 5000.00" />
      </div>
      {availableCredits.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="pay-credit">Apply credit (optional)</Label>
          <Select name="applyCreditId">
            <SelectTrigger id="pay-credit" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {availableCredits.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.transactionNumber} · {c.amount}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </FormDialog>
  );
}
