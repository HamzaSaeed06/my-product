"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) {
  const router = useRouter();

  function navigate(next: { dateFrom?: string; dateTo?: string }) {
    const params = new URLSearchParams({
      dateFrom: next.dateFrom ?? dateFrom,
      dateTo: next.dateTo ?? dateTo,
    });
    router.push(`/dashboard/reconciliation?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="recon-date-from" className="text-xs">
          From
        </Label>
        <Input id="recon-date-from" type="date" value={dateFrom} onChange={(e) => navigate({ dateFrom: e.target.value })} className="w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="recon-date-to" className="text-xs">
          To
        </Label>
        <Input id="recon-date-to" type="date" value={dateTo} onChange={(e) => navigate({ dateTo: e.target.value })} className="w-40" />
      </div>
    </div>
  );
}
