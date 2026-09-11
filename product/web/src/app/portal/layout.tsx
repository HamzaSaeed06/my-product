import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { logout } from "../dashboard/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PortalNav } from "@/components/portal-nav";

const STAFF_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "INCHARGE", "OFFICE"];

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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            I
          </div>
          <span className="text-sm font-medium text-foreground">Institution Management</span>
        </div>

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
            <DropdownMenuSeparator />
            <form action={logout}>
              <DropdownMenuItem render={<button type="submit" className="w-full cursor-pointer text-left" />}>
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <PortalNav role={role} />

      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
