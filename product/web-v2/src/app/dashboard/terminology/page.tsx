import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockTerminology } from "@/lib/mock/terminology";
import { TerminologyEditPopover } from "./terminology-edit-popover";

// Canonical DB/API/permission names never change — only the displayed
// label changes. This is why the canonical key stays visible and
// monospaced in its own column: it's the one place a human-facing ID is
// operationally correct to show, since it's the actual join key back to
// permissions and API fields, not a database cuid a viewer never needs.
export default function TerminologyPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Terminology"
        description="Rename what students/teachers/classes are called across the whole app — permissions and API fields never change, only the label."
      />
      <div className="surface-ring overflow-x-auto rounded-[var(--card-radius)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canonical key</TableHead>
              <TableHead>Singular</TableHead>
              <TableHead>Plural</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTerminology.map((term) => (
              <TableRow key={term.canonicalKey}>
                <TableCell className="font-mono text-xs text-muted-foreground">{term.canonicalKey}</TableCell>
                <TableCell>{term.singularLabel}</TableCell>
                <TableCell>{term.pluralLabel}</TableCell>
                <TableCell>
                  <TerminologyEditPopover term={term} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
