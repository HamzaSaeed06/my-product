"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createTicket(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/support-tickets", {
      method: "POST",
      body: {
        customerId: formData.get("customerId"),
        subject: formData.get("subject"),
        description: formData.get("description"),
        priority: formData.get("priority") || undefined,
      },
    });
    revalidatePath("/dashboard/support");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function assignTicket(ticketId: string, assignedToId: string | null): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/support-tickets/${ticketId}/assign`, { method: "POST", body: { assignedToId } });
    revalidatePath("/dashboard/support");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function resolveTicket(ticketId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/support-tickets/${ticketId}/resolve`, { method: "POST" });
    revalidatePath("/dashboard/support");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function closeTicket(ticketId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/support-tickets/${ticketId}/close`, { method: "POST" });
    revalidatePath("/dashboard/support");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
