"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createClass(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const sortOrderRaw = formData.get("sortOrder");
    await apiRequest("/api/v1/classes", {
      method: "POST",
      body: {
        name: formData.get("name"),
        sortOrder: sortOrderRaw ? Number(sortOrderRaw) : undefined,
      },
    });
    revalidatePath("/dashboard/classes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateClass(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    const sortOrderRaw = formData.get("sortOrder");
    await apiRequest(`/api/v1/classes/${id}`, {
      method: "PATCH",
      body: {
        name: formData.get("name"),
        sortOrder: sortOrderRaw ? Number(sortOrderRaw) : undefined,
      },
    });
    revalidatePath("/dashboard/classes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveClass(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/classes/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/classes");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
