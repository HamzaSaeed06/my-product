import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockFeatureConfig, mockCampusFeatureOverrides } from "@/lib/mock/feature-config";
import { mockCampuses } from "@/lib/mock/campuses";
import { CampusOverrideRow } from "./campus-override-row";

const POLICY_LABEL: Record<string, string> = {
  MANDATORY: "Mandatory — institute value always wins, campuses can't override",
  INSTITUTE_DEFAULT: "Institute default — a campus can override if it sets one",
  CAMPUS_CONTROLLED: "Campus controlled — each campus manages its own value",
};

const METHOD_LABEL: Record<string, string> = { QR: "QR code", MANUAL: "Manual", REMOTE_APPROVED: "Remote (approved)" };

// Only one feature is wired end-to-end so far (ATTENDANCE_CHECKIN_METHODS)
// — this page shows that one concretely rather than a generic table of
// every possible feature key, since each key's value shape genuinely
// differs and a one-size-fits-all editor would be dishonest about that.
export default function FeatureConfigPage() {
  const cfg = mockFeatureConfig;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature Config"
        description="Institute-vs-campus policy for features that vary by deployment or by campus."
      />

      <Card>
        <CardHeader>
          <CardTitle>{cfg.label}</CardTitle>
          <CardDescription>{cfg.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[var(--card-radius)] border border-border p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Policy mode</span>
              <span className="text-xs text-muted-foreground">{POLICY_LABEL[cfg.policyMode]}</span>
            </div>
            <StatusDot tone="neutral">{cfg.policyMode.replace(/_/g, " ")}</StatusDot>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">Institute default</span>
            <span className="text-sm text-muted-foreground">
              {cfg.instituteValue.map((v) => METHOD_LABEL[v]).join(", ")}
            </span>
          </div>
        </CardContent>
      </Card>

      {cfg.policyMode === "CAMPUS_CONTROLLED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Campus overrides</CardTitle>
            <CardDescription>Each campus manages its own value independently of the institute default above.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campus</TableHead>
                  <TableHead>Allowed methods</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCampuses.map((campus) => {
                  const override = mockCampusFeatureOverrides.find((o) => o.campusId === campus.id);
                  return (
                    <CampusOverrideRow
                      key={campus.id}
                      campusName={campus.name}
                      value={override?.value ?? cfg.instituteValue}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
