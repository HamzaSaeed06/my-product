"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface TimetableEntry {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  teacherId: string;
  subject: { name: string };
  teacher: { user: { fullName: string } };
}

interface Timetable {
  id: string;
  entries: TimetableEntry[];
}

export async function getEntriesForSection(sectionId: string, academicYearId: string): Promise<TimetableEntry[]> {
  const timetable = await apiRequest<Timetable>(`/api/v1/timetables?sectionId=${sectionId}&academicYearId=${academicYearId}`);
  return timetable.entries;
}

export async function createSubstitution(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/substitutions", {
      method: "POST",
      body: {
        timetableEntryId: formData.get("timetableEntryId"),
        date: formData.get("date"),
        substituteTeacherId: formData.get("substituteTeacherId"),
        reason: formData.get("reason") || undefined,
      },
    });
    revalidatePath("/dashboard/substitutions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function cancelSubstitution(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/substitutions/${id}/cancel`, { method: "POST" });
    revalidatePath("/dashboard/substitutions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
