"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createAdmission(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/admissions", {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        campusId: formData.get("campusId"),
        classId: formData.get("classId"),
        academicYearId: formData.get("academicYearId"),
      },
    });
    revalidatePath("/dashboard/admissions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function approveAdmission(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/admissions/${id}/approve`, { method: "POST" });
    revalidatePath("/dashboard/admissions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function rejectAdmission(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/admissions/${id}/reject`, { method: "POST" });
    revalidatePath("/dashboard/admissions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function withdrawAdmission(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/admissions/${id}/withdraw`, { method: "POST" });
    revalidatePath("/dashboard/admissions");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
