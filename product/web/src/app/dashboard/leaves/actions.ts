"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createLeave(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const subjectType = formData.get("subjectType");
    await apiRequest("/api/v1/leaves", {
      method: "POST",
      body: {
        subjectType,
        studentId: subjectType === "STUDENT" ? formData.get("studentId") || undefined : undefined,
        teacherId: subjectType === "TEACHER" ? formData.get("teacherId") || undefined : undefined,
        fromDate: formData.get("fromDate"),
        toDate: formData.get("toDate"),
        reason: formData.get("reason"),
      },
    });
    revalidatePath("/dashboard/leaves");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideLeave(id: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/leaves/${id}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/leaves");
    revalidatePath("/dashboard/attendance");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function cancelLeave(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/leaves/${id}/cancel`, { method: "POST" });
    revalidatePath("/dashboard/leaves");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
