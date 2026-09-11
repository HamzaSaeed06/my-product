"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createExamSchedule(examId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/exam-schedules", {
      method: "POST",
      body: {
        examId,
        subjectId: formData.get("subjectId"),
        classId: formData.get("classId"),
        sectionId: formData.get("sectionId"),
        date: formData.get("date"),
        startTime: formData.get("startTime"),
        endTime: formData.get("endTime"),
        room: formData.get("room") || undefined,
      },
    });
    revalidatePath(`/dashboard/exams/${examId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
