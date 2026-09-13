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
import { StatusDot } from "@/components/status-dot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CalendarOff, Receipt } from "lucide-react";
import { getStudentById } from "@/lib/mock/students";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

// A detail page's job is different from a list page's or a dashboard's: the
// identity/context facts (who is this, which campus, who's the guardian)
// need to stay visible no matter which tab is open — they're not "content,"
// they're the frame around the content. So this is a rail + main split, not
// a header-then-stacked-tabs layout: the rail never moves, the tabs swap
// only the right-hand content. The old Guardians tab folded into the rail
// since guardian contact is exactly this kind of always-relevant fact.
export default async function StudentDetailPage({ params }: PageProps<"/dashboard/students/[studentId]">) {
  const { studentId } = await params;
  const student = getStudentById(studentId);
  if (!student) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard/students" />}>Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-6">
          <div className="flex flex-col items-start gap-3">
            <Avatar className="size-16">
              <AvatarFallback className="bg-secondary text-lg text-secondary-foreground">
                {initials(student.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-[450] text-foreground">{student.fullName}</h1>
              <StatusDot tone={student.status === "ACTIVE" ? "success" : "neutral"}>
                {student.status === "ACTIVE" ? "Active" : student.status === "INACTIVE" ? "Inactive" : "Graduated"}
              </StatusDot>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col divide-y divide-border">
            <Fact label="Admission no." value={<span className="font-mono">{student.admissionNo}</span>} />
            <Fact label="Admitted on" value={<span className="font-mono">{student.admittedOn}</span>} />
            <Fact label="Campus" value={student.campusName} />
            <Fact label="Class" value={`${student.className} - ${student.section}`} />
          </div>

          <Separator />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Guardian</span>
            <span className="text-sm font-medium text-foreground">{student.guardianName}</span>
            <span className="font-mono text-sm text-muted-foreground">{student.guardianPhone}</span>
          </div>
        </aside>

        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Attendance snapshot</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This term</span>
                    <span className="font-mono">{student.attendancePct}%</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarOff />
                  </EmptyMedia>
                  <EmptyTitle>Attendance module not wired yet</EmptyTitle>
                  <EmptyDescription>This tab lands with the Academic Operations batch in Phase B.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TabsContent>

            <TabsContent value="fees">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Receipt />
                  </EmptyMedia>
                  <EmptyTitle>Fee ledger not wired yet</EmptyTitle>
                  <EmptyDescription>This tab lands with the Finance batch in Phase B.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
