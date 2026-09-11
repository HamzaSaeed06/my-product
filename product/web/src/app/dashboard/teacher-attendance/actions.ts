"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function markTeacherAttendance(teacherId: string, date: string, status: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/teacher-attendance", { method: "POST", body: { teacherId, date, status } });
    revalidatePath("/dashboard/teacher-attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function correctTeacherAttendance(recordId: string, status: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/teacher-attendance/${recordId}`, { method: "PATCH", body: { status } });
    revalidatePath("/dashboard/teacher-attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
