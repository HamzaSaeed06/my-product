"use client";

import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Viewer } from "@/lib/mock/session";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function SiteHeader({ viewer }: { viewer: Viewer }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        {viewer.scope ? (
          <span className="text-sm text-muted-foreground">{viewer.scope.campusName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">All campuses</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                {initials(viewer.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-foreground sm:inline">{viewer.fullName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{viewer.fullName}</span>
                <span className="text-xs text-muted-foreground">{viewer.email}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
