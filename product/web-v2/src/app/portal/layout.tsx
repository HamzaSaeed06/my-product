import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { PortalProvider } from "./portal-context";
import { PortalSidebar } from "./portal-sidebar";
import { PortalHeader } from "./portal-header";

// Same shell as the dashboard (SidebarProvider/AppSidebar-equivalent/
// SiteHeader-equivalent/main), not a separate visual language — a
// Teacher/Parent/Student is still the same product, just a different nav
// keyed by role instead of permission. See PortalSidebar/PortalHeader.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <SidebarProvider>
        <PortalSidebar />
        <SidebarInset>
          <PortalHeader />
          <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </PortalProvider>
  );
}
