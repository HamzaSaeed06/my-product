"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface InitiateResult {
  gatewayTransactionId: string;
}

export async function initiateOnlinePayment(invoiceId: string, amount: string): Promise<{ error?: string } | void> {
  let gatewayTransactionId: string;
  try {
    const result = await apiRequest<InitiateResult>("/api/v1/online-payment/initiate", {
      method: "POST",
      body: { invoiceId, amount },
    });
    gatewayTransactionId = result.gatewayTransactionId;
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
  redirect(`/portal/fees/pay/${gatewayTransactionId}`);
}

interface CallbackResult {
  outcome: "SUCCESS" | "FAILED" | "PENDING" | "DUPLICATE_IGNORED" | "AMOUNT_MISMATCH" | "UNMATCHED";
}

export async function confirmOnlinePayment(gatewayTransactionId: string): Promise<{ error?: string; outcome?: string }> {
  try {
    const result = await apiRequest<CallbackResult>(`/api/v1/online-payment/${gatewayTransactionId}/confirm`, { method: "POST" });
    revalidatePath("/portal/fees");
    return { outcome: result.outcome };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function cancelOnlinePayment(gatewayTransactionId: string): Promise<{ error?: string; outcome?: string }> {
  try {
    const result = await apiRequest<CallbackResult>(`/api/v1/online-payment/${gatewayTransactionId}/cancel`, { method: "POST" });
    revalidatePath("/portal/fees");
    return { outcome: result.outcome };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
