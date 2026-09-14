import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-cookie";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { mockViewer } from "@/lib/mock/session";

// Phase A/B: viewer comes from the mock fixture below. Phase C swaps this
// for a real session read (see product/web/src/lib/session.ts for the
// pattern to reuse: cookie-based session, GET /api/v1/auth/me) — every
// consumer already takes a `Viewer` shaped exactly like that response, so
// that swap should not require touching AppSidebar/SiteHeader/pages.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const viewer = mockViewer;
  // Read back the open/collapsed cookie the sidebar itself writes on every
  // toggle, so a refresh renders in the same state instead of always
  // reopening — without this, defaultOpen silently stayed hardcoded true.
  const sidebarOpen = (await cookies()).get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar viewer={viewer} />
      <SidebarInset>
        <SiteHeader viewer={viewer} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
