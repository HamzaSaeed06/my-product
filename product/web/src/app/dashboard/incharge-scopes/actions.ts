"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createInchargeScope(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/incharge-scopes", {
      method: "POST",
      body: {
        userId: formData.get("userId"),
        campusId: formData.get("campusId"),
        academicYearId: formData.get("academicYearId"),
        classIds: formData.getAll("classIds"),
        sectionIds: formData.getAll("sectionIds"),
      },
    });
    revalidatePath("/dashboard/incharge-scopes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateInchargeScope(
  id: string,
  expectedVersion: number,
  formData: FormData
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/incharge-scopes/${id}`, {
      method: "PATCH",
      body: {
        classIds: formData.getAll("classIds"),
        sectionIds: formData.getAll("sectionIds"),
        expectedVersion,
      },
    });
    revalidatePath("/dashboard/incharge-scopes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function revokeInchargeScope(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/incharge-scopes/${id}/revoke`, { method: "POST" });
    revalidatePath("/dashboard/incharge-scopes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
