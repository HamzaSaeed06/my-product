"use client";

import type { ComponentProps } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Every icon-only action button (edit, delete, lock, reorder, ...) gets:
// 1. A visible tooltip, not just an aria-label — a sighted mouse user gets
//    no explanation for what a bare icon does otherwise.
// 2. A persistent (not hover-only) background chip. Ghost's own
//    hover:bg-muted is nearly invisible in this theme specifically —
//    --muted equals --background in light mode by design (the Vercel-
//    minimal palette has almost no distinct "shades") — and hover states
//    don't exist at all on touch, so a mobile user got zero visual cue an
//    icon was tappable. --accent is the one token actually distinct from
//    the surface it sits on, so it's used here instead of the default
//    ghost variant.
export function IconActionButton({
  label,
  size = "icon-sm",
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "render" | "aria-label" | "variant"> & {
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            aria-label={label}
            className={cn("bg-accent/60 hover:bg-accent", className)}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
