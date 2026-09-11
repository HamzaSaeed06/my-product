"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function generateReportCard(resultId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/report-cards", { method: "POST", body: { resultId } });
    revalidatePath("/dashboard/report-cards");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
