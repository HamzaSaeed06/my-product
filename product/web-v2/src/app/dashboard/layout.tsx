import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { mockViewer } from "@/lib/mock/session";

// Phase A/B: viewer comes from the mock fixture below. Phase C swaps this
// for a real session read (see product/web/src/lib/session.ts for the
// pattern to reuse: cookie-based session, GET /api/v1/auth/me) — every
// consumer already takes a `Viewer` shaped exactly like that response, so
// that swap should not require touching AppSidebar/SiteHeader/pages.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const viewer = mockViewer;

  return (
    <SidebarProvider>
      <AppSidebar viewer={viewer} />
      <SidebarInset>
        <SiteHeader viewer={viewer} />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
