"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function createStudent(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/students", {
      method: "POST",
      body: {
        fullName: formData.get("fullName"),
        dateOfBirth: emptyToUndefined(formData.get("dateOfBirth")),
        gender: emptyToUndefined(formData.get("gender")),
        phone: emptyToUndefined(formData.get("phone")),
        address: emptyToUndefined(formData.get("address")),
      },
    });
    revalidatePath("/dashboard/students");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
