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

      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-secondary text-base text-secondary-foreground">
            {initials(student.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{student.fullName}</h1>
            <StatusDot tone={student.status === "ACTIVE" ? "success" : "neutral"}>
              {student.status === "ACTIVE" ? "Active" : student.status === "INACTIVE" ? "Inactive" : "Graduated"}
            </StatusDot>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {student.admissionNo} &middot; {student.className} - {student.section} &middot; {student.campusName}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Admission</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Admission no.</span><span className="font-mono">{student.admissionNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Admitted on</span><span className="font-mono">{student.admittedOn}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Campus</span><span>{student.campusName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span>{student.className} - {student.section}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Attendance snapshot</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">This term</span><span className="font-mono">{student.attendancePct}%</span></div>
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

        <TabsContent value="guardians" className="max-w-xl">
          <Card>
            <CardContent className="flex flex-col gap-1.5 pt-6 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{student.guardianName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono">{student.guardianPhone}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
