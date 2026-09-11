import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";

// A 403 from the report endpoint (a role with dashboard access but no
// report.view_X for this specific category — e.g. Office has
// report.view_financial but not report.view_academic) must render a
// clean message, not crash the Server Component with an uncaught throw.
export function NoReportAccess({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Alert variant="destructive">
        <AlertDescription>You do not have permission to view this report.</AlertDescription>
      </Alert>
    </div>
  );
}
