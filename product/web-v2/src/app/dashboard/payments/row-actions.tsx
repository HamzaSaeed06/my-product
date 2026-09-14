"use client";

import { MoreHorizontal, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Payment } from "@/lib/mock/payments";

export function PaymentRowActions({
  payment,
  pending,
  onRequestReversal,
}: {
  payment: Payment;
  pending: boolean;
  onRequestReversal: (payment: Payment) => void;
}) {
  const canRequest = payment.status === "SUCCESS" && !pending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" disabled={payment.status !== "SUCCESS"} />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem variant="destructive" disabled={!canRequest} onClick={() => onRequestReversal(payment)}>
          <Undo2 className="size-3.5" />
          {pending ? "Reversal pending" : "Request reversal"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
