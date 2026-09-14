"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VoidInvoiceDialog } from "./void-dialog";
import type { Invoice } from "@/lib/mock/invoices";

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const [voidOpen, setVoidOpen] = useState(false);
  const isVoid = invoice.status === "VOID";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem render={<Link href={`/dashboard/invoices/${invoice.id}`} />}>
            <Eye className="size-3.5" />
            View
          </DropdownMenuItem>
          {!isVoid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setVoidOpen(true)}>
                <Ban className="size-3.5" />
                Void
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <VoidInvoiceDialog open={voidOpen} onOpenChange={setVoidOpen} onConfirm={() => {}} />
    </>
  );
}
