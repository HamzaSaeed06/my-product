"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createRefund(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/refunds", {
      method: "POST",
      body: {
        paymentId: formData.get("paymentId"),
        amount: formData.get("amount"),
        reason: formData.get("reason"),
        method: formData.get("method") || undefined,
      },
    });
    revalidatePath("/dashboard/refunds");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decideRefund(id: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/refunds/${id}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/refunds");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function completeRefund(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/refunds/${id}/complete`, { method: "POST" });
    revalidatePath("/dashboard/refunds");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
