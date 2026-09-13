import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one "section label above a content block" style for the app —
// previously drifted into two variants (font-medium/mb-4 on the student
// detail page vs. font-semibold/mb-3 on every Reports page) with no
// canonical source. Standardizes on the Reports pages' variant since it was
// already the majority usage.
export function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-sm font-semibold text-foreground", className)}>{children}</h2>;
}
