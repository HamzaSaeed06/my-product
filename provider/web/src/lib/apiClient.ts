import "server-only";
import { cookies } from "next/headers";
import { API_URL, COOKIE_NAMES } from "./api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}
): Promise<T> {
  const cookieStore = await cookies();
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Cookie: cookieStore.toString() };

  if (method !== "GET") {
    headers["X-CSRF-Token"] = cookieStore.get(COOKIE_NAMES.csrfToken)?.value ?? "";
  }
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const errorBody = data as { error?: string; message?: string } | undefined;
    throw new ApiError(res.status, errorBody?.error ?? "UNKNOWN_ERROR", errorBody?.message ?? "Request failed");
  }

  return data as T;
}
