import { PortalProvider } from "./portal-context";
import { PortalShell } from "./portal-shell";

// A single unified portal route tree for all three roles, confirmed
// matching the real backend — not a /teacher, /parent, /student split.
// Deliberately its own shell (no dashboard sidebar): plainer, friendlier,
// lower information density, matching what a teacher/parent/student
// actually needs versus an office admin's dense operational views.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
