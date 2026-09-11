"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function assignStudentFee(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/student-fees", {
      method: "POST",
      body: {
        studentId: formData.get("studentId"),
        feeStructureId: formData.get("feeStructureId"),
        overrideAmount: formData.get("overrideAmount") || undefined,
      },
    });
    revalidatePath("/dashboard/student-fees");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveStudentFee(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/student-fees/${id}/archive`, { method: "POST" });
    revalidatePath("/dashboard/student-fees");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
