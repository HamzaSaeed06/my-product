import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Baby } from "lucide-react";
import { mockParents } from "@/lib/mock/parents";
import { mockStudents } from "@/lib/mock/students";
import { ChildCard } from "./child-card";
import { ParentDetailActions } from "./parent-detail-actions";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase();
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// Rail + main, same shape as Student Detail: identity/contact facts stay
// framed on the left (they don't belong to any one "tab"), the children —
// this page's actual content — fill the main area. No tabs: there's only
// one content type here, so forcing a tab bar around it would be
// structure for its own sake, not structure the page's own job needs.
export default async function ParentDetailPage({ params }: PageProps<"/dashboard/parents/[parentId]">) {
  const { parentId } = await params;
  const parent = mockParents.find((p) => p.id === parentId);
  if (!parent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard/parents" />}>Parents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{parent.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex flex-col items-start gap-3">
            <Avatar className="size-16">
              <AvatarFallback className="bg-secondary text-lg text-secondary-foreground">{initials(parent.fullName)}</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-[450] text-foreground">{parent.fullName}</h1>
          </div>

          <Separator />

          <div className="flex flex-col divide-y divide-border">
            <Fact label="Phone" value={parent.phone} />
            <Fact label="Email" value={parent.email ?? "—"} />
            <Fact label="Address" value={parent.address ?? "—"} />
          </div>

          <Separator />

          <ParentDetailActions parent={parent} />
        </aside>

        <div className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {parent.children.length === 0 ? "Children" : parent.children.length === 1 ? "1 child" : `${parent.children.length} children`}
          </h2>
          {parent.children.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {parent.children.map((link) => {
                const student = mockStudents.find((s) => s.id === link.studentId);
                if (!student) return null;
                return <ChildCard key={link.linkId} link={link} student={student} parentName={parent.fullName} />;
              })}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Baby />
                </EmptyMedia>
                <EmptyTitle>No children linked yet</EmptyTitle>
                <EmptyDescription>Use &quot;Link child&quot; to connect this guardian to a student.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
