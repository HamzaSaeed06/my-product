"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface CreateGatewayResult {
  id: string;
  provider: string;
  name: string;
  isActive: boolean;
  webhookSecret: string;
}

export async function createPaymentGateway(formData: FormData): Promise<{ error?: string; webhookSecret?: string }> {
  try {
    const result = await apiRequest<CreateGatewayResult>("/api/v1/payment-gateways", {
      method: "POST",
      body: { provider: formData.get("provider"), name: formData.get("name") },
    });
    revalidatePath("/dashboard/payment-gateways");
    return { webhookSecret: result.webhookSecret };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function setGatewayActive(gatewayId: string, isActive: boolean): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/payment-gateways/${gatewayId}/active`, { method: "POST", body: { isActive } });
    revalidatePath("/dashboard/payment-gateways");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
