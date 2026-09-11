"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createInvoice(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const items = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
    await apiRequest("/api/v1/invoices", {
      method: "POST",
      body: { studentId: formData.get("studentId"), dueDate: formData.get("dueDate"), items },
    });
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function voidInvoice(id: string, reason: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/invoices/${id}/void`, { method: "POST", body: { reason } });
    revalidatePath("/dashboard/invoices");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
