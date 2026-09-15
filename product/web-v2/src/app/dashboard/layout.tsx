import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-cookie";
import { ROLE_COOKIE_NAME } from "@/lib/role-cookie";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { resolveRoleId, getViewerForRole } from "@/lib/mock/role-switch";

// Phase A/B: viewer is computed from whichever role the RoleSwitcher cookie
// selects (defaulting to Super Admin), not a single fixed fixture — so the
// sidebar/permissions can be previewed per role before real auth exists.
// Phase C swaps this for a real session read (see product/web/src/lib/
// session.ts for the pattern to reuse: cookie-based session, GET
// /api/v1/auth/me) — every consumer already takes a `Viewer` shaped
// exactly like that response, so that swap should not require touching
// AppSidebar/SiteHeader/pages.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const cookieStore = await cookies();
  const roleId = resolveRoleId(cookieStore.get(ROLE_COOKIE_NAME)?.value);
  const viewer = getViewerForRole(roleId);
  // Read back the open/collapsed cookie the sidebar itself writes on every
  // toggle, so a refresh renders in the same state instead of always
  // reopening — without this, defaultOpen silently stayed hardcoded true.
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar viewer={viewer} />
      <SidebarInset>
        <SiteHeader viewer={viewer} activeRoleId={roleId} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
