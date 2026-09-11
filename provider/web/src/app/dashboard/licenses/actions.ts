"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

interface GenerateLicenseResult {
  id: string;
  signedJwt: string;
}

export async function generateLicense(formData: FormData): Promise<{ error?: string; signedJwt?: string }> {
  try {
    const result = await apiRequest<GenerateLicenseResult>("/api/v1/licenses", {
      method: "POST",
      body: {
        customerId: formData.get("customerId"),
        planId: formData.get("planId"),
        deploymentId: formData.get("deploymentId"),
        expiresInDays: Number(formData.get("expiresInDays")),
      },
    });
    revalidatePath("/dashboard/licenses");
    return { signedJwt: result.signedJwt };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

async function setLicenseStatus(licenseId: string, action: "activate" | "suspend" | "revoke"): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/licenses/${licenseId}/${action}`, { method: "POST" });
    revalidatePath("/dashboard/licenses");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function activateLicense(licenseId: string) {
  return setLicenseStatus(licenseId, "activate");
}
export async function suspendLicense(licenseId: string) {
  return setLicenseStatus(licenseId, "suspend");
}
export async function revokeLicense(licenseId: string) {
  return setLicenseStatus(licenseId, "revoke");
}
