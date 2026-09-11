"use server";

import { revalidatePath } from "next/cache";
import { apiRequest, apiUpload, ApiError } from "@/lib/apiClient";

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str === "" ? undefined : str;
}

export async function updateStudent(studentId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/students/${studentId}`, {
      method: "PATCH",
      body: {
        fullName: formData.get("fullName"),
        dateOfBirth: emptyToUndefined(formData.get("dateOfBirth")),
        gender: emptyToUndefined(formData.get("gender")),
        phone: emptyToUndefined(formData.get("phone")),
        address: emptyToUndefined(formData.get("address")),
      },
    });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function withdrawStudent(studentId: string, reason?: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/students/${studentId}/withdraw`, { method: "POST", body: { reason } });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function archiveStudentDetail(studentId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/students/${studentId}/archive`, { method: "POST" });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function createEnrollment(studentId: string, formData: FormData): Promise<{ error?: string } | void> {
  try {
    await apiRequest("/api/v1/enrollments", {
      method: "POST",
      body: {
        studentId,
        academicYearId: formData.get("academicYearId"),
        classId: formData.get("classId"),
        sectionId: formData.get("sectionId"),
        rollNumber: emptyToUndefined(formData.get("rollNumber")),
      },
    });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function transferEnrollment(
  studentId: string,
  enrollmentId: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/enrollments/${enrollmentId}/transfer`, {
      method: "POST",
      body: {
        classId: formData.get("classId"),
        sectionId: formData.get("sectionId"),
        rollNumber: emptyToUndefined(formData.get("rollNumber")),
      },
    });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function withdrawEnrollment(studentId: string, enrollmentId: string): Promise<{ error?: string } | void> {
  try {
    await apiRequest(`/api/v1/enrollments/${enrollmentId}/withdraw`, { method: "POST" });
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}

export async function uploadStudentDocument(
  studentId: string,
  formData: FormData
): Promise<{ error?: string } | void> {
  try {
    await apiUpload(`/api/v1/students/${studentId}/documents`, formData);
    revalidatePath(`/dashboard/students/${studentId}`);
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Something went wrong" };
  }
}
