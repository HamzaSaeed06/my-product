"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { CheckinMethod } from "@/lib/mock/feature-config";
import { CampusOverrideSheet } from "./campus-override-sheet";

const METHOD_LABEL: Record<CheckinMethod, string> = {
  QR: "QR code",
  MANUAL: "Manual",
  REMOTE_APPROVED: "Remote (approved)",
};

export function CampusOverrideRow({ campusName, value }: { campusName: string; value: CheckinMethod[] }) {
  const [open, setOpen] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{campusName}</TableCell>
      <TableCell>{value.map((v) => METHOD_LABEL[v]).join(", ")}</TableCell>
      <TableCell>
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" />
        </Button>
        <CampusOverrideSheet campusName={campusName} value={value} open={open} onOpenChange={setOpen} />
      </TableCell>
    </TableRow>
  );
}
