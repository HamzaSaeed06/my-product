"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/export-csv";

export function ExportButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  return (
    <Button size="sm" variant="outline" onClick={() => downloadCsv(filename, rows)}>
      <Download className="size-3.5" />
      Export CSV
    </Button>
  );
}
