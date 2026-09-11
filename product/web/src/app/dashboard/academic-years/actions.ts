"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createAcademicYear(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/academic-years", {
      method: "POST",
      body: {
        name: formData.get("name"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      },
    });
    revalidatePath("/dashboard/academic-years");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateAcademicYear(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/academic-years/${id}`, {
      method: "PATCH",
      body: {
        name: formData.get("name"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
      },
    });
    revalidatePath("/dashboard/academic-years");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function closeAcademicYear(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/academic-years/${id}/close`, { method: "POST" });
    revalidatePath("/dashboard/academic-years");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
