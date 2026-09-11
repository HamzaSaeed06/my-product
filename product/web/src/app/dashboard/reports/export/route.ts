import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/api";

const CATEGORY_PATHS: Record<string, string> = {
  academic: "/api/v1/reports/academic",
  attendance: "/api/v1/reports/attendance",
  financial: "/api/v1/reports/financial",
  admissions: "/api/v1/reports/admissions",
  staff: "/api/v1/reports/staff",
};

// A same-origin passthrough, not a public proxy: the API's cookies are
// httpOnly and scoped to this app's own origin (the BFF pattern every
// other Server Action already uses — see apiClient.ts), so a browser
// can't hit product/api's CSV endpoint directly with credentials. This
// route re-attaches them server-side, forwards only a fixed whitelist of
// report categories (never an arbitrary path), and streams the CSV
// response straight back.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const path = CATEGORY_PATHS[category];
  if (!path) {
    return NextResponse.json({ error: "UNKNOWN_CATEGORY" }, { status: 400 });
  }

  const forwardParams = new URLSearchParams(req.nextUrl.searchParams);
  forwardParams.delete("category");
  forwardParams.set("format", "csv");

  const cookieStore = await cookies();
  const apiRes = await fetch(`${API_URL}${path}?${forwardParams.toString()}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!apiRes.ok) {
    const body = await apiRes.text();
    return new NextResponse(body, { status: apiRes.status, headers: { "Content-Type": apiRes.headers.get("Content-Type") ?? "application/json" } });
  }

  const csv = await apiRes.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${category}-report.csv"`,
    },
  });
}
