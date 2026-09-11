"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function createTeacher(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const joiningDateRaw = formData.get("joiningDate");
    await apiRequest("/api/v1/teachers", {
      method: "POST",
      body: {
        userId: formData.get("userId"),
        employeeCode: emptyToUndefined(formData.get("employeeCode")),
        qualification: emptyToUndefined(formData.get("qualification")),
        joiningDate: joiningDateRaw ? String(joiningDateRaw) : undefined,
        phone: emptyToUndefined(formData.get("phone")),
      },
    });
    revalidatePath("/dashboard/teachers");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateTeacher(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/teachers/${id}`, {
      method: "PATCH",
      body: {
        employeeCode: emptyToUndefined(formData.get("employeeCode")),
        qualification: emptyToUndefined(formData.get("qualification")),
        phone: emptyToUndefined(formData.get("phone")),
      },
    });
    revalidatePath("/dashboard/teachers");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveTeacher(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/teachers/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/teachers");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
