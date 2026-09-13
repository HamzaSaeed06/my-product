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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatStrip, type StatEntry } from "@/components/stat-tile";
import { DataTable } from "@/components/data-table";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Users2, Receipt } from "lucide-react";
import { mockCampuses } from "@/lib/mock/campuses";
import { mockSections } from "@/lib/mock/sections";
import { mockInchargeScopes } from "@/lib/mock/incharge-scopes";
import { mockStaffUsers } from "@/lib/mock/users";
import { sectionColumns } from "../../sections/columns";
import { scopeColumns } from "../../incharge-scopes/columns";

// A campus hub combines 4 independently-permissioned resources on one
// screen (per the real backend: sections/incharge-scopes/teachers/fee-
// structures each already accept a campusId filter, no new endpoints
// needed) — each tab reuses the exact same columns as its top-level page,
// just pre-filtered, rather than inventing a second table shape.
export default async function CampusDetailPage({ params }: PageProps<"/dashboard/campuses/[campusId]">) {
  const { campusId } = await params;
  const campus = mockCampuses.find((c) => c.id === campusId);
  if (!campus) notFound();

  const sections = mockSections.filter((s) => s.campusId === campusId && !s.archived);
  const scopes = mockInchargeScopes.filter((s) => s.campusId === campusId);
  const staff = mockStaffUsers.filter((u) => u.campusId === campusId);

  const stats: StatEntry[] = [
    { label: "Sections", value: sections.length },
    { label: "Incharge scopes", value: scopes.filter((s) => !s.revoked).length },
    { label: "Teachers", value: campus.teachers },
    { label: "Students", value: campus.students.toLocaleString() },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard/campuses" />}>Campuses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{campus.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-xl font-[450] text-foreground">{campus.name}</h1>
        <p className="text-sm text-muted-foreground">{campus.address ?? "No address on file"}</p>
      </div>

      <StatStrip entries={stats} />

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="incharge-scopes">Incharge Scopes</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="fee-structures">Fee Structures</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <DataTable
            columns={sectionColumns}
            data={sections}
            emptyTitle="No sections at this campus yet"
            emptyDescription="Create a section for this campus from the Sections page."
          />
        </TabsContent>

        <TabsContent value="incharge-scopes">
          <DataTable
            columns={scopeColumns}
            data={scopes}
            emptyTitle="No incharge scopes at this campus yet"
            emptyDescription="Grant an Incharge access to this campus from the Incharge Scopes page."
          />
        </TabsContent>

        <TabsContent value="staff">
          {staff.length ? (
            <div className="surface-ring flex flex-col divide-y divide-border rounded-[var(--card-radius)]">
              {staff.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{u.fullName}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{u.role.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users2 />
                </EmptyMedia>
                <EmptyTitle>No staff records here yet</EmptyTitle>
                <EmptyDescription>The full Users/Teachers module lands with the People batch in Phase B.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="fee-structures">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Receipt />
              </EmptyMedia>
              <EmptyTitle>Fee structures not wired yet</EmptyTitle>
              <EmptyDescription>This tab lands with the Finance batch in Phase B.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>
      </Tabs>
    </div>
  );
}
