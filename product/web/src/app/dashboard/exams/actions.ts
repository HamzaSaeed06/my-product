"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createExam(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/exams", {
      method: "POST",
      body: { academicYearId: formData.get("academicYearId"), name: formData.get("name") },
    });
    revalidatePath("/dashboard/exams");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function publishExam(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/exams/${id}/publish`, { method: "POST" });
    revalidatePath("/dashboard/exams");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
