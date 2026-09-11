"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createPlan(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const featuresRaw = String(formData.get("features") ?? "");
    const features = featuresRaw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    await apiRequest("/api/v1/plans", {
      method: "POST",
      body: {
        name: formData.get("name"),
        tier: formData.get("tier"),
        features,
        maxStudents: Number(formData.get("maxStudents")),
        maxCampuses: Number(formData.get("maxCampuses")),
        maxStaff: Number(formData.get("maxStaff")),
        maxStorageMb: Number(formData.get("maxStorageMb")),
      },
    });
    revalidatePath("/dashboard/plans");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function setPlanActive(planId: string, isActive: boolean): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/plans/${planId}/active`, { method: "POST", body: { isActive } });
    revalidatePath("/dashboard/plans");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
