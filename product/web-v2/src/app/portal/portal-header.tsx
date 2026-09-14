"use client";

import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { mockParents } from "@/lib/mock/parents";
import { getStudentById } from "@/lib/mock/students";
import { mockAppUsers } from "@/lib/mock/app-users";
import { PORTAL_DEMO, type PortalRole } from "@/lib/mock/portal-session";
import { usePortal } from "./portal-context";

const ROLE_LABEL: Record<PortalRole, string> = { TEACHER: "Teacher", PARENT: "Parent", STUDENT: "Student" };

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

// Same shell as SiteHeader (dashboard) — SidebarTrigger, a left-side
// context control, ThemeSwitcher, and the account dropdown all in the
// same slots. The only real difference: the portal has no real session
// yet, so the persona switcher sits where CampusScopePicker sits on the
// dashboard — a review-time-only stand-in, not a shipped control.
export function PortalHeader() {
  const { role, setRole, activeChildId, setActiveChildId } = usePortal();
  const parent = mockParents.find((p) => p.id === PORTAL_DEMO.parentId);

  const currentName =
    role === "TEACHER"
      ? mockAppUsers.find((u) => u.id === PORTAL_DEMO.teacherUserId)?.fullName
      : role === "PARENT"
        ? parent?.fullName
        : getStudentById(PORTAL_DEMO.studentId)?.fullName;
  const currentEmail = role === "TEACHER" ? mockAppUsers.find((u) => u.id === PORTAL_DEMO.teacherUserId)?.email : parent?.email ?? undefined;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-5" />
        <Select value={role} onValueChange={(v) => setRole(v as PortalRole)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue>{(v) => ROLE_LABEL[v as PortalRole]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="PARENT">Parent</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
          </SelectContent>
        </Select>
        {role === "PARENT" && parent && parent.children.length > 1 && (
          <Select value={activeChildId} onValueChange={(v) => v && setActiveChildId(v)}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue>{(v) => getStudentById(v as string)?.fullName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {parent.children.map((c) => (
                <SelectItem key={c.studentId} value={c.studentId}>
                  {getStudentById(c.studentId)?.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <Separator orientation="vertical" className="h-5" />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">{initials(currentName ?? "")}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm text-foreground sm:inline">{currentName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{currentName}</span>
                  <span className="text-xs text-muted-foreground">{currentEmail ?? ROLE_LABEL[role]}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
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
