"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, ApiError } from "@/lib/apiClient";

export async function createComplaint(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/complaints", {
      method: "POST",
      body: {
        studentId: formData.get("studentId") || undefined,
        category: formData.get("category"),
        description: formData.get("description"),
      },
    });
    revalidatePath("/dashboard/complaints");
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function assignComplaint(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/assign`, {
      method: "POST",
      body: { assignedToId: formData.get("assignedToId") },
    });
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function startComplaintProgress(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/start-progress`, { method: "POST" });
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function addComplaintNote(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/notes`, {
      method: "POST",
      body: { note: formData.get("note") },
    });
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function resolveComplaint(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/resolve`, {
      method: "POST",
      body: { resolutionNote: formData.get("resolutionNote") },
    });
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function closeComplaint(id: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/close`, { method: "POST" });
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function reopenComplaint(id: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/complaints/${id}/reopen`, {
      method: "POST",
      body: { reason: formData.get("reason") },
    });
    revalidatePath("/dashboard/complaints");
    revalidatePath(`/dashboard/complaints/${id}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
