"use server";

import { revalidatePath } from "next/cache";
import { apiUpload, ApiError } from "@/lib/apiClient";

export async function createPortalHomework(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiUpload("/api/v1/homework", formData);
    revalidatePath("/portal/homework");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
