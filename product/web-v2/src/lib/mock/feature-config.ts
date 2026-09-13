export type PolicyMode = "MANDATORY" | "INSTITUTE_DEFAULT" | "CAMPUS_CONTROLLED";
export type CheckinMethod = "QR" | "MANUAL" | "REMOTE_APPROVED";

export interface FeatureConfigRow {
  featureKey: string;
  label: string;
  description: string;
  policyMode: PolicyMode;
  /** Institute-level value — the seed default when CAMPUS_CONTROLLED, the only value when MANDATORY or INSTITUTE_DEFAULT (absent a campus override). */
  instituteValue: CheckinMethod[];
}

export interface CampusFeatureOverride {
  campusId: string;
  value: CheckinMethod[];
}

// Only one feature is wired end-to-end on the real backend so far —
// ATTENDANCE_CHECKIN_METHODS. The resolution rule: MANDATORY means the
// institute value always wins (a campus override is refused at write
// time); INSTITUTE_DEFAULT means a campus row overrides if present;
// CAMPUS_CONTROLLED means each campus manages its own row independently.
export const mockFeatureConfig: FeatureConfigRow = {
  featureKey: "ATTENDANCE_CHECKIN_METHODS",
  label: "Attendance check-in methods",
  description: "Which check-in methods teachers and staff can use to mark attendance.",
  policyMode: "CAMPUS_CONTROLLED",
  instituteValue: ["QR", "MANUAL"],
};

export const mockCampusFeatureOverrides: CampusFeatureOverride[] = [
  { campusId: "cmp_main", value: ["QR", "MANUAL", "REMOTE_APPROVED"] },
  { campusId: "cmp_north", value: ["QR", "MANUAL"] },
];
