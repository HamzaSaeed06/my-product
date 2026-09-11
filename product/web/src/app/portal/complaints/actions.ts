"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createPortalComplaint(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/complaints", {
      method: "POST",
      body: {
        studentId: formData.get("studentId") || undefined,
        category: formData.get("category"),
        description: formData.get("description"),
      },
    });
    revalidatePath("/portal/complaints");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
