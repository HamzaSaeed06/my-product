"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function createCampus(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/campuses", {
      method: "POST",
      body: {
        name: formData.get("name"),
        address: emptyToUndefined(formData.get("address")),
        phone: emptyToUndefined(formData.get("phone")),
      },
    });
    revalidatePath("/dashboard/campuses");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateCampus(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/campuses/${id}`, {
      method: "PATCH",
      body: {
        name: formData.get("name"),
        address: emptyToUndefined(formData.get("address")),
        phone: emptyToUndefined(formData.get("phone")),
      },
    });
    revalidatePath("/dashboard/campuses");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveCampus(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/campuses/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/campuses");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
