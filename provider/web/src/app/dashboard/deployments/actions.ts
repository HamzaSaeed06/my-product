"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface CreateDeploymentResult {
  id: string;
  heartbeatToken: string;
}

export async function createDeployment(formData: FormData): Promise<{ error?: string; heartbeatToken?: string }> {
  try {
    const result = await apiRequest<CreateDeploymentResult>("/api/v1/deployments", {
      method: "POST",
      body: {
        customerId: formData.get("customerId"),
        version: formData.get("version"),
        url: formData.get("url"),
      },
    });
    revalidatePath("/dashboard/deployments");
    return { heartbeatToken: result.heartbeatToken };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function setDeploymentStatus(
  deploymentId: string,
  status: "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DECOMMISSIONED"
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/deployments/${deploymentId}/status`, { method: "POST", body: { status } });
    revalidatePath("/dashboard/deployments");
    revalidatePath(`/dashboard/deployments/${deploymentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
