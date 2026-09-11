"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// A real anchor-driven download (not startTransition + apiRequest) so the
// browser's native save-file flow handles the response — matches how
// every other file the app hands back (document uploads aside) is meant
// to leave the browser. Surfaces a 403 as inline text instead of letting
// the browser silently "download" a JSON error body.
export function ExportCsvButton({ category, params }: { category: string; params: Record<string, string> }) {
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    const query = new URLSearchParams({ category, ...params });
    const res = await fetch(`/dashboard/reports/export?${query.toString()}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? "You do not have permission to export this report.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleClick}>
        Export CSV
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
