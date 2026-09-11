"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createCurriculumTopic(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/curriculum", {
      method: "POST",
      body: {
        subjectId: formData.get("subjectId"),
        classId: formData.get("classId"),
        academicYearId: formData.get("academicYearId"),
        topic: formData.get("topic"),
        sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : undefined,
      },
    });
    revalidatePath("/dashboard/curriculum");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveCurriculumTopic(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/curriculum/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/curriculum");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function toggleCurriculumProgress(
  curriculumId: string,
  sectionId: string,
  completed: boolean
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/curriculum/${curriculumId}/progress/${sectionId}`, { method: "POST", body: { completed } });
    revalidatePath("/dashboard/curriculum");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
