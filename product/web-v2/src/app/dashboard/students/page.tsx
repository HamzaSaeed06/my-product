import { PageHeader } from "@/components/page-header";
import { mockStudents } from "@/lib/mock/students";
import { StudentFilters } from "./student-filters";

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Students" description={`${mockStudents.length} students across all campuses — mock data.`} />
      <StudentFilters students={mockStudents} />
    </div>
  );
}
