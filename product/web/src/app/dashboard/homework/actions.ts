"use server";

import { revalidatePath } from "next/cache";
import { apiUpload, apiRequest, ApiError } from "@/lib/apiClient";

export async function createHomework(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiUpload("/api/v1/homework", formData);
    revalidatePath("/dashboard/homework");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function publishHomework(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/homework/${id}/publish`, { method: "POST" });
    revalidatePath("/dashboard/homework");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveHomework(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/homework/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/homework");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
