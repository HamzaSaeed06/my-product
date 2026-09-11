"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface ActionResult {
  error?: string;
  success?: boolean;
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function updateInstitute(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiRequest("/api/v1/institute", {
      method: "PATCH",
      body: {
        name: formData.get("name"),
        type: formData.get("type"),
        address: emptyToUndefined(formData.get("address")),
        phone: emptyToUndefined(formData.get("phone")),
        email: emptyToUndefined(formData.get("email")),
        website: emptyToUndefined(formData.get("website")),
      },
    });
    revalidatePath("/dashboard/institute");
    return { success: true };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function updateInstituteSettings(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiRequest("/api/v1/institute/settings", {
      method: "PATCH",
      body: {
        timezone: emptyToUndefined(formData.get("timezone")),
        locale: emptyToUndefined(formData.get("locale")),
        currency: emptyToUndefined(formData.get("currency")),
        studentLabel: emptyToUndefined(formData.get("studentLabel")),
        teacherLabel: emptyToUndefined(formData.get("teacherLabel")),
        classLabel: emptyToUndefined(formData.get("classLabel")),
        sectionLabel: emptyToUndefined(formData.get("sectionLabel")),
      },
    });
    revalidatePath("/dashboard/institute");
    return { success: true };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
