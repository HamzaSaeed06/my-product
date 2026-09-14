import { PageHeader } from "@/components/page-header";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { mockLicenseStatus, type LicenseState } from "@/lib/mock/license";
import { mockStudents } from "@/lib/mock/students";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockAppUsers } from "@/lib/mock/app-users";

const STATE_TONE: Record<LicenseState, StatusTone> = {
  NOT_CONFIGURED: "neutral",
  INVALID: "danger",
  VALID: "success",
  EXPIRING_SOON: "warning",
  EXPIRING_CRITICAL: "warning",
  EXPIRED_GRACE: "danger",
  EXPIRED_FINAL: "danger",
};
const STATE_LABEL: Record<LicenseState, string> = {
  NOT_CONFIGURED: "Not configured",
  INVALID: "Invalid",
  VALID: "Valid",
  EXPIRING_SOON: "Expiring soon",
  EXPIRING_CRITICAL: "Expiring — critical",
  EXPIRED_GRACE: "Expired (grace period)",
  EXPIRED_FINAL: "Expired",
};

function usageRow(label: string, used: number, limit: number) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// A JWT verified in-memory, not a stored record — read-only by nature.
// Deliberately visible without any permission gate in the real backend
// (the login screen needs it before a session exists), the only page in
// this project with no anyOf on its nav entry.
export default function LicenseStatusPage() {
  const license = mockLicenseStatus;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="License Status"
        description="Issued by the provider, verified live — nothing here is editable from this dashboard."
        actions={<StatusDot tone={STATE_TONE[license.state]}>{STATE_LABEL[license.state]}</StatusDot>}
      />

      <div className="surface-ring flex flex-col gap-4 rounded-[var(--card-radius)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Plan</span>
            <span className="text-sm font-medium text-foreground">{license.plan}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-muted-foreground">Expires</span>
            <span className="font-mono text-sm text-foreground">{license.expiresAt}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {license.features.map((feature) => (
            <span key={feature} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="surface-ring flex flex-col gap-4 rounded-[var(--card-radius)] p-4">
        <span className="label-eyebrow text-muted-foreground">Usage against plan limits</span>
        {usageRow("Students", mockStudents.length, license.limits.maxStudents)}
        {usageRow("Campuses", mockCampuses.length, license.limits.maxCampuses)}
        {usageRow("Staff", mockAppUsers.length, license.limits.maxStaff)}
      </div>
    </div>
  );
}
