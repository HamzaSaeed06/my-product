"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Every icon-only action button (edit, delete, lock, reorder, ...) should
// carry a visible tooltip, not just an aria-label — a sighted mouse user
// gets no explanation for what a bare icon does otherwise. Standardizes
// this instead of hand-wiring Tooltip+TooltipTrigger+Button at every call
// site; the hover background itself already comes for free from Button's
// own "ghost" variant, this only adds the missing tooltip layer.
export function IconActionButton({
  label,
  variant = "ghost",
  size = "icon-sm",
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "render" | "aria-label"> & {
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant={variant} size={size} aria-label={label} className={className} {...props} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
