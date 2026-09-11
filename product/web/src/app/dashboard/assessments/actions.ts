"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createAssessment(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/assessments", {
      method: "POST",
      body: {
        subjectId: formData.get("subjectId"),
        sectionId: formData.get("sectionId"),
        classId: formData.get("classId"),
        academicYearId: formData.get("academicYearId"),
        teacherId: formData.get("teacherId"),
        title: formData.get("title"),
        totalMarks: Number(formData.get("totalMarks")),
        assessmentDate: formData.get("assessmentDate"),
      },
    });
    revalidatePath("/dashboard/assessments");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveAssessment(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/assessments/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/assessments");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
