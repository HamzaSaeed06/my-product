import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger";

const DOT_TONE: Record<StatusTone, string> = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-signal",
  danger: "bg-destructive",
};

// Vercel's deployment-status convention: a small solid dot plus plain text,
// never a colored pill fill. Reads as data (a fact about the row) instead
// of decoration, and scales better down a dense column than a badge does.
export function StatusDot({ tone = "neutral", children }: { tone?: StatusTone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[tone])} aria-hidden />
      {children}
    </span>
  );
}
