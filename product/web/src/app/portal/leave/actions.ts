"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function requestPortalLeave(formData: FormData): Promise<{ error?: string } | void> {
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
    revalidatePath("/portal/leave");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function cancelPortalLeave(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/leaves/${id}/cancel`, { method: "POST" });
    revalidatePath("/portal/leave");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
