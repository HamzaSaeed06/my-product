export interface Delegation {
  id: string;
  grantedByUserId: string;
  delegateToUserId: string;
  role: "CAMPUS_HEAD" | "INCHARGE" | "OFFICE";
  campusId: string;
  validFrom: string;
  validUntil: string;
  reason: string;
  revoked: boolean;
}

// Temporary authority handoff — e.g. a Campus Head going on leave delegates
// their role to an Office staffer for a fixed window. Delegating
// SUPER_ADMIN itself is refused outright by the backend, so it's not an
// option here. Only Super Admin (any campus) or a Campus Head (their own
// campus only) can create/revoke these.
export const mockDelegations: Delegation[] = [
  {
    id: "del_1",
    grantedByUserId: "usr_head_main",
    delegateToUserId: "usr_office_1",
    role: "CAMPUS_HEAD",
    campusId: "cmp_main",
    validFrom: "2026-09-10",
    validUntil: "2026-09-20",
    reason: "Annual leave — covering fee approvals and staff attendance sign-off.",
    revoked: false,
  },
  {
    id: "del_2",
    grantedByUserId: "usr_super_admin",
    delegateToUserId: "usr_incharge_3",
    role: "CAMPUS_HEAD",
    campusId: "cmp_north",
    validFrom: "2026-08-01",
    validUntil: "2026-08-15",
    reason: "Interim coverage while North Town's Campus Head role was vacant.",
    revoked: true,
  },
];
