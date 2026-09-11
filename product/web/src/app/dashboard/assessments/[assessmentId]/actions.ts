"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function enterMarks(
  assessmentId: string,
  studentId: string,
  marksObtained: number,
  remarks?: string
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/assessments/${assessmentId}/results`, {
      method: "POST",
      body: { studentId, marksObtained, remarks },
    });
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function submitAssessment(assessmentId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/assessments/${assessmentId}/submit`, { method: "POST" });
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function requestMarksCorrection(
  assessmentId: string,
  resultId: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/assessments/results/${resultId}/request-correction`, {
      method: "POST",
      body: { newMarks: Number(formData.get("newMarks")), reason: formData.get("reason") },
    });
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideMarksCorrection(
  assessmentId: string,
  approvalId: string,
  decision: "APPROVED" | "REJECTED"
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/assessments/corrections/${approvalId}/decide`, { method: "POST", body: { decision } });
    revalidatePath(`/dashboard/assessments/${assessmentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
