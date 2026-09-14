"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockDiscounts } from "@/lib/mock/discounts";
import { discountColumns } from "./columns";
import { RequestDiscountDialog } from "./request-dialog";

export default function DiscountsPage() {
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Discounts"
        description="Reduces what a student's future invoices should charge — sibling, merit, staff, or a one-off reason. Needs approval before it takes effect."
        actions={
          <Button size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="size-3.5" />
            Request discount
          </Button>
        }
      />
      <DataTable
        columns={discountColumns}
        data={mockDiscounts}
        emptyTitle="No discounts requested"
        emptyDescription="Request one for a student to get it approved."
      />
      <RequestDiscountDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
}
