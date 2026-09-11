"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createTeacherAssignment(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/teacher-assignments", {
      method: "POST",
      body: {
        teacherId: formData.get("teacherId"),
        subjectId: formData.get("subjectId"),
        classId: formData.get("classId"),
        sectionId: formData.get("sectionId"),
        academicYearId: formData.get("academicYearId"),
      },
    });
    revalidatePath("/dashboard/teacher-assignments");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveTeacherAssignment(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/teacher-assignments/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/teacher-assignments");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
