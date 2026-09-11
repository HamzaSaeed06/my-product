"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createWaiver(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/waivers", {
      method: "POST",
      body: { invoiceId: formData.get("invoiceId"), amount: formData.get("amount"), reason: formData.get("reason") },
    });
    revalidatePath("/dashboard/waivers");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideWaiver(id: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/waivers/${id}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/waivers");
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
