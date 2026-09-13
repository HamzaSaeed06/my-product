import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { InstituteOverview } from "./institute-overview";

export default async function DashboardPage() {
  // Layout above already redirects to /login if unauthenticated, so this
  // is always non-null here — re-reading is free thanks to React's cache().
  const user = await getCurrentUser();

  // Super Admin gets the cross-campus monitoring dashboard (Phase 11 Phase
  // A) — everyone else keeps this simple landing screen for now (a
  // documented, deliberate follow-up, same as Phase 7's bespoke Campus Head/
  // Incharge/Office home pages).
  if (user!.roles.includes("SUPER_ADMIN")) {
    return (
      <div>
        <PageHeader title="Institute Overview" description="Every campus at a glance — read-only." />
        <InstituteOverview />
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-foreground">Welcome, {user!.fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user!.email}</p>
      </div>
    </div>
  );
}
