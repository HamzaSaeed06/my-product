import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin, uniqueSuffix } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";

const suffix = uniqueSuffix();
let studentId: string;
let assigneeUserId: string;
let complaintId: string;
let secondComplaintId: string;
let campusId: string;

describe("Complaints API (real database)", () => {
  beforeAll(async () => {
    // This student is deliberately created with no Enrollment at all (a
    // bare profile, same as a real pre-admission record) — Complaint now
    // requires a campusId (docs/PHASE_11A_CAMPUS_SCOPING_IMPLEMENTATION_PLAN.md
    // Gap 2), and a student with no enrollment has no derivable campus, so
    // an explicit campusId is passed on creation below, same as the
    // "no student at all" anonymous-complaint case.
    const institute = await prisma.institute.findFirstOrThrow();
    const [student, assignee, campus] = await Promise.all([
      prisma.student.create({ data: { studentCode: `STU-CMPLT-${suffix}`, fullName: `Complaint Test ${suffix}` } }),
      prisma.user.create({ data: { email: `complaint-assignee-${suffix}@example.test`, passwordHash: "x", fullName: "Complaint Assignee" } }),
      prisma.campus.create({ data: { instituteId: institute.id, name: `Complaint Test Campus ${suffix}` } }),
    ]);
    studentId = student.id;
    assigneeUserId = assignee.id;
    campusId = campus.id;
  });

  afterAll(async () => {
    if (complaintId) await prisma.complaintNote.deleteMany({ where: { complaintId } }).catch(() => {});
    if (secondComplaintId) await prisma.complaintNote.deleteMany({ where: { complaintId: secondComplaintId } }).catch(() => {});
    if (complaintId) await prisma.complaint.delete({ where: { id: complaintId } }).catch(() => {});
    if (secondComplaintId) await prisma.complaint.delete({ where: { id: secondComplaintId } }).catch(() => {});
    if (studentId) await prisma.student.delete({ where: { id: studentId } }).catch(() => {});
    if (assigneeUserId) await prisma.user.delete({ where: { id: assigneeUserId } }).catch(() => {});
    if (campusId) await prisma.campus.delete({ where: { id: campusId } }).catch(() => {});
  });

  it("refuses creating a student-linked complaint with no derivable campus and no explicit campusId", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/complaints")
      .send({ studentId, category: "Bullying", description: "Reported an incident in the playground" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("CAMPUS_REQUIRED");
  });

  it("creates a complaint (OPEN)", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/complaints")
      .send({ studentId, campusId, category: "Bullying", description: "Reported an incident in the playground" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("OPEN");
    complaintId = res.body.id;
  });

  it("refuses starting progress before assignment", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/start-progress`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });

  it("assigns the complaint (OPEN -> ASSIGNED)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/assign`).send({ assignedToId: assigneeUserId });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ASSIGNED");
  });

  it("refuses resolving before progress has started", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/resolve`).send({ resolutionNote: "Too soon" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });

  it("starts progress (ASSIGNED -> IN_PROGRESS)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/start-progress`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("adds an investigation note", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/notes`).send({ note: "Spoke with both students involved" });
    expect(res.status).toBe(201);
    expect(res.body.note).toBe("Spoke with both students involved");
  });

  it("refuses closing before resolution", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/close`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });

  it("resolves the complaint (IN_PROGRESS -> RESOLVED)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/resolve`).send({ resolutionNote: "Mediated; both parties apologized" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
  });

  it("closes the complaint (RESOLVED -> CLOSED)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/close`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
  });

  it("refuses adding notes to a closed complaint", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/notes`).send({ note: "Too late" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("COMPLAINT_CLOSED");
  });

  it("reopens the complaint (CLOSED -> REOPENED)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/reopen`).send({ reason: "New evidence surfaced" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REOPENED");
  });

  it("re-assigns a reopened complaint (REOPENED -> ASSIGNED)", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/assign`).send({ assignedToId: assigneeUserId });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ASSIGNED");
  });

  it("lists complaints filtered by assignedToId", async () => {
    const res = await asSuperAdmin().get(`/api/v1/complaints?assignedToId=${assigneeUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("gets a single complaint by id, including its notes", async () => {
    const res = await asSuperAdmin().get(`/api/v1/complaints/${complaintId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(complaintId);
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
  });

  it("refuses creating a campus-less, student-less complaint", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/complaints")
      .send({ category: "Facilities", description: "Broken window in room 4" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("CAMPUS_REQUIRED");
  });

  it("creates a second, anonymous (no studentId) complaint with an explicit campusId", async () => {
    const res = await asSuperAdmin()
      .post("/api/v1/complaints")
      .send({ campusId, category: "Facilities", description: "Broken window in room 4" });
    expect(res.status).toBe(201);
    expect(res.body.studentId).toBeNull();
    secondComplaintId = res.body.id;
  });

  it("refuses assigning a complaint that is not OPEN or REOPENED", async () => {
    const res = await asSuperAdmin().post(`/api/v1/complaints/${complaintId}/assign`).send({ assignedToId: assigneeUserId });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("INVALID_STATE_TRANSITION");
  });
});
