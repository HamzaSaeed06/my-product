"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createDiscount(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const amount = formData.get("amount");
    const percentage = formData.get("percentage");
    await apiRequest("/api/v1/discounts", {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        type: formData.get("type"),
        amount: amount || undefined,
        percentage: percentage || undefined,
        reason: formData.get("reason"),
      },
    });
    revalidatePath("/dashboard/discounts");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideDiscount(id: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/discounts/${id}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/discounts");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
