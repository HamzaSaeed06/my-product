"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { mockPaymentGateways, type PaymentGateway } from "@/lib/mock/payment-gateways";
import { getGatewayColumns } from "./columns";
import { CreateGatewayDialog } from "./create-dialog";

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>(mockPaymentGateways);
  const [createOpen, setCreateOpen] = useState(false);

  function toggle(id: string) {
    setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g)));
    toast.success("Gateway status updated.");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payment Gateways"
        description="Provider configuration for online payments. Only Simulated is actually wired up today — the rest are placeholders."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Add gateway
          </Button>
        }
      />
      <DataTable columns={getGatewayColumns(toggle)} data={gateways} emptyTitle="No gateways configured" emptyDescription="Add one to start accepting online payments." />
      <CreateGatewayDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
