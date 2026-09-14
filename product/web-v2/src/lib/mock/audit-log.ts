// Immutable by design in the real backend — no create/update/delete
// routes exist or ever should. resource is a free string, not an enum, so
// this deliberately reuses real ids from every module already built
// across the project to look authentic.
export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  recordId: string;
  reason: string | null;
  viaDelegationId: string | null;
  createdAt: string;
}

export const mockAuditLog: AuditLogEntry[] = [
  { id: "al_1", actorId: "usr_head_main", action: "APPROVE", resource: "Admission", recordId: "adm_1", reason: null, viaDelegationId: null, createdAt: "2026-09-13T08:10:00" },
  { id: "al_2", actorId: "usr_head_main", action: "REVERSE", resource: "Payment", recordId: "pay_inv_stu_0148_rev", reason: "Recorded against the wrong student.", viaDelegationId: null, createdAt: "2026-09-12T14:22:00" },
  { id: "al_3", actorId: "usr_super_admin", action: "UPDATE", resource: "RolePermission", recordId: "role_exam_coordinator", reason: null, viaDelegationId: null, createdAt: "2026-09-11T09:00:00" },
  { id: "al_4", actorId: "usr_incharge_1", action: "APPROVE", resource: "Leave", recordId: "lv_2", reason: "Doctor's note on file.", viaDelegationId: null, createdAt: "2026-09-10T09:00:00" },
  { id: "al_5", actorId: "usr_office_1", action: "VOID", resource: "Invoice", recordId: "inv_stu_0227", reason: "Student withdrew before the term started.", viaDelegationId: null, createdAt: "2026-09-08T10:00:00" },
  { id: "al_6", actorId: "usr_incharge_2", action: "CREATE", resource: "Substitution", recordId: "sub_1", reason: null, viaDelegationId: "del_1", createdAt: "2026-09-07T07:30:00" },
  { id: "al_7", actorId: "usr_head_main", action: "APPROVE", resource: "Refund", recordId: "rf_1", reason: null, viaDelegationId: null, createdAt: "2026-09-05T00:00:00" },
  { id: "al_8", actorId: "usr_super_admin", action: "PUBLISH", resource: "Exam", recordId: "exam_1", reason: null, viaDelegationId: null, createdAt: "2026-08-20T09:00:00" },
];
