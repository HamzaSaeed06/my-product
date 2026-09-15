"use client";

import type { ComponentProps } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Every icon-only action button (edit, delete, lock, reorder, ...) gets:
// 1. A visible tooltip, not just an aria-label — a sighted mouse user gets
//    no explanation for what a bare icon does otherwise.
// 2. A persistent (not hover-only) solid background chip, confirmed with
//    the user to match the sidebar's own "active item" treatment
//    (data-active:bg-sidebar-accent — a solid fill, not a translucent
//    one) rather than the default ghost variant's hover:bg-muted, which
//    is nearly invisible in this theme (--muted equals --background in
//    light mode) and never shows at all on touch (no hover state).
// Radius deliberately stays Button's own default (--button-radius, 6px) —
// tried matching the sidebar's --nav-radius (2px) first, but per
// DESIGN_SYSTEM.md's own "Radius & elevation" rule that token is scoped
// specifically to nav elements ("tighter because nav items are the most
// 'attached to the page' interactive element"), not action buttons in
// general content. Confirmed with the user to follow the documented
// default instead of a one-off exception here.
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
            className={cn("bg-accent hover:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_8%)]", className)}
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
