"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createUser(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/users", {
      method: "POST",
      body: {
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
      },
    });
    revalidatePath("/dashboard/users");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/users/${userId}/active`, {
      method: "POST",
      body: { isActive },
    });
    revalidatePath("/dashboard/users");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function assignRole(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const userId = formData.get("userId");
    const campusId = formData.get("campusId");
    await apiRequest(`/api/v1/users/${userId}/roles`, {
      method: "POST",
      body: {
        roleId: formData.get("roleId"),
        campusId: campusId && typeof campusId === "string" && campusId !== "" ? campusId : null,
      },
    });
    revalidatePath("/dashboard/users");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function removeRole(userId: string, userRoleId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/users/${userId}/roles/${userRoleId}`, { method: "DELETE" });
    revalidatePath("/dashboard/users");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
