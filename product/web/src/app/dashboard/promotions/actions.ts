"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createPromotion(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/promotions", {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        fromEnrollmentId: formData.get("fromEnrollmentId"),
        academicYearId: formData.get("academicYearId"),
        targetClassId: formData.get("targetClassId"),
        targetSectionId: formData.get("targetSectionId"),
        decision: formData.get("decision"),
        reason: formData.get("reason") || undefined,
      },
    });
    revalidatePath("/dashboard/promotions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decidePromotionClassJump(approvalId: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/promotions/class-jump/${approvalId}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/promotions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
