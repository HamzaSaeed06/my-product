"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createFeeCategory(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/fee-categories", {
      method: "POST",
      body: { instituteId: formData.get("instituteId"), name: formData.get("name") },
    });
    revalidatePath("/dashboard/fee-structures");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveFeeCategory(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/fee-categories/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/fee-structures");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function createFeeStructure(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/fee-structures", {
      method: "POST",
      body: {
        instituteId: formData.get("instituteId"),
        classId: formData.get("classId"),
        feeCategoryId: formData.get("feeCategoryId"),
        name: formData.get("name"),
        amount: formData.get("amount"),
        frequency: formData.get("frequency"),
        effectiveFrom: formData.get("effectiveFrom"),
      },
    });
    revalidatePath("/dashboard/fee-structures");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveFeeStructure(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/fee-structures/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/fee-structures");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
