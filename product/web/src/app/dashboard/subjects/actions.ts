"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createSubject(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/subjects", {
      method: "POST",
      body: { name: formData.get("name"), code: formData.get("code") || undefined },
    });
    revalidatePath("/dashboard/subjects");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateSubject(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/subjects/${id}`, {
      method: "PATCH",
      body: { name: formData.get("name"), code: formData.get("code") || undefined },
    });
    revalidatePath("/dashboard/subjects");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveSubject(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/subjects/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/subjects");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
