"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createSection(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const capacityRaw = formData.get("capacity");
    await apiRequest("/api/v1/sections", {
      method: "POST",
      body: {
        classId: formData.get("classId"),
        campusId: formData.get("campusId"),
        academicYearId: formData.get("academicYearId"),
        name: formData.get("name"),
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
      },
    });
    revalidatePath("/dashboard/sections");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateSection(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    const capacityRaw = formData.get("capacity");
    await apiRequest(`/api/v1/sections/${id}`, {
      method: "PATCH",
      body: {
        name: formData.get("name"),
        capacity: capacityRaw ? Number(capacityRaw) : undefined,
      },
    });
    revalidatePath("/dashboard/sections");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveSection(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/sections/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/sections");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
