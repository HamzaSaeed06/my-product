"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function recordPayment(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/payments", {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        invoiceId: formData.get("invoiceId"),
        amount: formData.get("amount"),
        applyCreditId: formData.get("applyCreditId") || undefined,
      },
    });
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function requestPaymentReversal(paymentId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/payments/${paymentId}/request-reversal`, {
      method: "POST",
      body: { reason: formData.get("reason") },
    });
    revalidatePath("/dashboard/payments");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function decidePaymentReversal(approvalId: string, decision: "APPROVED" | "REJECTED"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/payments/reversals/${approvalId}/decide`, { method: "POST", body: { decision } });
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
