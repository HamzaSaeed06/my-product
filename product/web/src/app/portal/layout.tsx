import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";
import { logout } from "../dashboard/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PortalNav } from "@/components/portal-nav";
import { ChildSwitcher } from "@/components/child-switcher";
import { cn } from "@/lib/utils";

const STAFF_ROLES = ["SUPER_ADMIN", "CAMPUS_HEAD", "INCHARGE", "OFFICE"];

interface Student {
  id: string;
  fullName: string;
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  // A staff user who lands here directly belongs in the admin shell.
  if (user.roles.some((r) => STAFF_ROLES.includes(r))) {
    redirect("/dashboard");
  }

  const role: "TEACHER" | "PARENT" | "STUDENT" = user.roles.includes("TEACHER")
    ? "TEACHER"
    : user.roles.includes("PARENT")
      ? "PARENT"
      : "STUDENT";

  // A TEACHER/STUDENT role login isn't the same as having the matching
  // Teacher/Student profile — Users only creates the login + role; the
  // profile itself is created separately (Teachers page, or Admissions).
  // Every portal page under this layout assumes that id exists (several
  // use `user.teacherId!` / `user.studentId!` directly), so gate here
  // once rather than patching each page — this is the one shell every
  // one of them renders inside.
  const missingProfile =
    (role === "TEACHER" && !user.teacherId) || (role === "STUDENT" && !user.studentId);

  // Fetched once here (rather than repeated in every page) so the switcher
  // can live in the persistent header — see child-switcher.tsx. Named `kids`
  // to avoid colliding with this layout's own `children` prop (the page
  // content) below.
  const kids = role === "PARENT" && !missingProfile ? await apiRequest<Student[]>("/api/v1/students") : [];

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            I
          </div>
          <span className={cn("text-sm font-medium text-foreground", kids.length > 1 && "hidden sm:inline")}>
            Institution Management
          </span>
        </div>

        {kids.length > 1 ? (
          <Suspense fallback={null}>
            <ChildSwitcher students={kids} />
          </Suspense>
        ) : null}

        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
              <Avatar className="size-7">
                <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </form>
        </div>
      </header>

      {missingProfile ? (
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">
            Your {role === "TEACHER" ? "Teacher" : "Student"} profile hasn&apos;t been set up yet. Ask your Super
            Admin or Campus Head to add you on the {role === "TEACHER" ? "Teachers" : "Admissions"} page.
          </p>
        </main>
      ) : (
        <>
          <PortalNav role={role} />
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </>
      )}
    </div>
  );
}
