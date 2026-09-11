"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createCustomer(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/customers", {
      method: "POST",
      body: {
        name: formData.get("name"),
        contactName: formData.get("contactName"),
        contactEmail: formData.get("contactEmail"),
        contactPhone: formData.get("contactPhone") || undefined,
      },
    });
    revalidatePath("/dashboard/customers");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function setCustomerStatus(customerId: string, status: "ACTIVE" | "INACTIVE"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/customers/${customerId}/status`, { method: "POST", body: { status } });
    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${customerId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
