"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function createParent(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/parents", {
      method: "POST",
      body: {
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        email: emptyToUndefined(formData.get("email")),
        address: emptyToUndefined(formData.get("address")),
      },
    });
    revalidatePath("/dashboard/parents");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function linkChild(parentId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/parents/${parentId}/children`, {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        relationship: emptyToUndefined(formData.get("relationship")),
      },
    });
    revalidatePath("/dashboard/parents");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function unlinkChild(parentId: string, linkId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/parents/${parentId}/children/${linkId}`, { method: "DELETE" });
    revalidatePath("/dashboard/parents");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
