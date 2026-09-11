"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function addTimetableEntry(timetableId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/timetables/${timetableId}/entries`, {
      method: "POST",
      body: {
        dayOfWeek: formData.get("dayOfWeek"),
        periodNumber: Number(formData.get("periodNumber")),
        subjectId: formData.get("subjectId"),
        teacherId: formData.get("teacherId"),
      },
    });
    revalidatePath("/dashboard/timetable");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function removeTimetableEntry(entryId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/timetables/entries/${entryId}`, { method: "DELETE" });
    revalidatePath("/dashboard/timetable");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function publishTimetable(timetableId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/timetables/${timetableId}/publish`, { method: "POST" });
    revalidatePath("/dashboard/timetable");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
