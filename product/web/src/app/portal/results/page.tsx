import { getCurrentUser } from "@/lib/session";
import { apiRequest } from "@/lib/apiClient";

interface ResultItem {
  id: string;
  marksObtained: number;
  totalMarks: number;
  grade: string | null;
  subject: { name: string };
}

interface Result {
  id: string;
  exam: { name: string };
  items: ResultItem[];
}

interface Student {
  id: string;
  fullName: string;
}

export default async function PortalResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { studentId: requestedStudentId } = await searchParams;

  const students = user.roles.includes("PARENT") ? await apiRequest<Student[]>("/api/v1/students") : [];
  const studentId = user.roles.includes("STUDENT") ? user.studentId! : (requestedStudentId ?? students[0]?.id);

  if (!studentId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-foreground">Results</h1>
        <p className="mt-4 text-sm text-muted-foreground">No children linked to your account yet.</p>
      </div>
    );
  }

  const results = await apiRequest<Result[]>(`/api/v1/results?studentId=${studentId}`);

  return (
    <div>
      <h1 className="text-lg font-semibold text-foreground">Results</h1>
      {results.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No published results yet.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {results.map((result) => (
            <div key={result.id} className="rounded-lg border border-border p-4">
              <p className="mb-3 text-sm font-medium text-foreground">{result.exam.name}</p>
              <div className="flex flex-wrap gap-2">
                {result.items.map((item) => (
                  <div key={item.id} className="rounded-md bg-secondary/50 px-3 py-1.5 text-xs">
                    <span className="font-medium text-foreground">{item.subject.name}:</span>{" "}
                    <span className="text-muted-foreground">
                      {item.marksObtained}/{item.totalMarks} {item.grade ? `(${item.grade})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
