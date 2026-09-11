"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createCashClosing(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/cash-closing", {
      method: "POST",
      body: {
        campusId: formData.get("campusId"),
        date: formData.get("date"),
        openingBalance: formData.get("openingBalance"),
        collections: formData.get("collections"),
        refundsPaidOut: formData.get("refundsPaidOut") || "0",
        actualBalance: formData.get("actualBalance"),
      },
    });
    revalidatePath("/dashboard/cash-closing");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function approveCashClosing(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/cash-closing/${id}/approve`, { method: "POST" });
    revalidatePath("/dashboard/cash-closing");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
