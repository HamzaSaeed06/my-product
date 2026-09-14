"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

// The signed-in identity + Log out live at the bottom of the sidebar
// itself (not the header) — same convention on the dashboard and the
// portal, since they now share one visual system rather than each having
// their own account-menu placement.
export function NavUser({ name, subtitle }: { name: string; subtitle?: string }) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="h-10 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground" />
            }
          >
            <Avatar className="size-8 rounded-md">
              <AvatarFallback className="rounded-md bg-secondary text-xs text-secondary-foreground">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{name}</span>
              {subtitle && <span className="truncate text-xs text-sidebar-foreground/60">{subtitle}</span>}
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5 py-0.5 text-left">
                  <span className="truncate text-sm font-medium text-foreground">{name}</span>
                  {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="size-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
