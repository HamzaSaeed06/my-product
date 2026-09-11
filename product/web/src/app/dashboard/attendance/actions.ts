"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function markAttendance(
  sectionId: string,
  date: string,
  entries: { studentId: string; status: string }[]
): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/attendance", { method: "POST", body: { sectionId, date, entries } });
    revalidatePath("/dashboard/attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function requestAttendanceCorrection(attendanceId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/attendance/${attendanceId}/request-correction`, {
      method: "POST",
      body: { newStatus: formData.get("newStatus"), reason: formData.get("reason") },
    });
    revalidatePath("/dashboard/attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideAttendanceCorrection(
  approvalId: string,
  decision: "APPROVED" | "REJECTED"
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/attendance/corrections/${approvalId}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
