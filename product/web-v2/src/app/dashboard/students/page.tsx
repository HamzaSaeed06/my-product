import { mockStudents } from "@/lib/mock/students";
import { StudentFilters } from "./student-filters";

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">{mockStudents.length} students across all campuses &mdash; mock data.</p>
        </div>
      </div>
      <StudentFilters students={mockStudents} />
    </div>
  );
}
