import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar-cookie";
import { PortalProvider } from "./portal-context";
import { PortalSidebar } from "./portal-sidebar";
import { PortalHeader } from "./portal-header";

// Same shell as the dashboard (SidebarProvider/AppSidebar-equivalent/
// SiteHeader-equivalent/main), not a separate visual language — a
// Teacher/Parent/Student is still the same product, just a different nav
// keyed by role instead of permission. See PortalSidebar/PortalHeader.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Same cookie the dashboard reads back — one sidebar open/collapsed
  // preference shared across both shells, so it survives a refresh.
  const sidebarOpen = (await cookies()).get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <PortalProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <PortalSidebar />
        <SidebarInset>
          <PortalHeader />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PortalProvider>
  );
}
