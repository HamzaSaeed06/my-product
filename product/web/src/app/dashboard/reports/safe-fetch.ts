import { apiRequest, ApiError } from "@/lib/apiClient";

// The campus/exam/class/section lists that back each report page's
// filter dropdowns are supplementary — a role that can view a report but
// lacks the underlying resource permission (e.g. Incharge has
// report.view_attendance but not campus.view) should still see the
// report, just with a narrower filter bar, not a blanket "no
// permission" page. Only a 403 from the REPORT endpoint itself should
// block the page — see each page's outer try/catch.
export async function apiRequestOrEmpty<T>(path: string): Promise<T[]> {
  try {
    return await apiRequest<T[]>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return [];
    throw err;
  }
}
