"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function enterResultItem(resultId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/${resultId}/items`, {
      method: "POST",
      body: {
        subjectId: formData.get("subjectId"),
        marksObtained: Number(formData.get("marksObtained")),
        totalMarks: Number(formData.get("totalMarks")),
        grade: formData.get("grade") || undefined,
        remarks: formData.get("remarks") || undefined,
      },
    });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function submitResult(resultId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/${resultId}/submit`, { method: "POST" });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function reviewResult(resultId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/${resultId}/review`, { method: "POST" });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function finalizeResult(resultId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/${resultId}/finalize`, { method: "POST" });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function publishResult(resultId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/${resultId}/publish`, { method: "POST" });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function requestResultCorrection(itemId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/items/${itemId}/request-correction`, {
      method: "POST",
      body: { newMarks: Number(formData.get("newMarks")), reason: formData.get("reason") },
    });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideResultCorrection(approvalId: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/results/corrections/${approvalId}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/results");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
