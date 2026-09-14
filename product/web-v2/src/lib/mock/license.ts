// No DB model on the tenant side at all — a JWT (LicenseClaims) issued by
// the provider and verified in-memory, confirmed from the real backend.
// Purely informational; nothing here is ever written from this dashboard.
export type LicenseState = "NOT_CONFIGURED" | "INVALID" | "VALID" | "EXPIRING_SOON" | "EXPIRING_CRITICAL" | "EXPIRED_GRACE" | "EXPIRED_FINAL";

export interface LicenseStatus {
  state: LicenseState;
  plan: string;
  features: string[];
  limits: { maxStudents: number; maxCampuses: number; maxStaff: number; maxStorageGb: number };
  issuedAt: string;
  expiresAt: string;
}

export const mockLicenseStatus: LicenseStatus = {
  state: "EXPIRING_SOON",
  plan: "Growth",
  features: ["Admissions & Enrollment", "Academic Operations", "Finance", "Reports", "Parent Portal"],
  limits: { maxStudents: 1500, maxCampuses: 6, maxStaff: 200, maxStorageGb: 50 },
  issuedAt: "2025-07-01",
  expiresAt: "2026-09-30",
};
