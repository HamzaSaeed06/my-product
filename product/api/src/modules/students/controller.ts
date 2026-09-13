import type { Request, Response } from "express";
import { z } from "zod";
import * as studentsService from "./service.js";
import { getUserPermissionKeys } from "../../middleware/authorize.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { getActorProfile, getOwnChildStudentIds, assertStudentInScope, assertSectionQueryInScope } from "../../lib/scope.js";

// Only SUPER_ADMIN is truly unrestricted — matches lib/scope.ts. CAMPUS_HEAD/
// OFFICE get their own branch below (campus-filtered), not this set,
// since 2026-09-12's campus-scoping change (this file used to keep its own
// duplicate of scope.ts's old UNRESTRICTED_ROLES, which silently kept
// CAMPUS_HEAD/OFFICE seeing every campus's students even after scope.ts
// itself was fixed — the actual bug this comment is here to prevent
// recurring).
const UNRESTRICTED_ROLES = new Set(["SUPER_ADMIN"]);

const statusEnum = z.enum(["ACTIVE", "WITHDRAWN", "ARCHIVED"]);

const createSchema = z.object({
  fullName: z.string().min(1).max(200),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().max(30).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  // The child's own CNIC/B-Form — optional, many young children don't have
  // one yet (Phase 11 Phase C-addendum).
  nationalId: z.string().min(1).max(50).optional(),
});

const updateSchema = createSchema.partial();

const withdrawSchema = z.object({ reason: z.string().max(500).optional() });

export async function searchStudentsHandler(req: Request, res: Response): Promise<void> {
  const q = z.string().default("").parse(req.query.q ?? "");
  res.status(200).json(await studentsService.searchStudents(q));
}

const listQuerySchema = z.object({
  status: statusEnum.optional(),
  sectionId: z.string().uuid().optional(),
  // Only meaningful for an unrestricted actor (SUPER_ADMIN) drilling into
  // one campus, e.g. from the Institute Overview dashboard — a
  // campus-assigned actor already gets this from their own campusIds, and
  // the value here would just be redundant for them.
  campusId: z.string().uuid().optional(),
});

export async function listStudentsHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);

  if (profile.roles.some((r) => UNRESTRICTED_ROLES.has(r))) {
    const { campusId, ...rest } = query;
    res.status(200).json(await studentsService.listStudents(campusId ? { ...rest, campusIdIn: [campusId] } : rest));
    return;
  }

  if (profile.roles.includes("STUDENT")) {
    res.status(200).json(await studentsService.listStudents({ ...query, idIn: profile.studentId ? [profile.studentId] : [] }));
    return;
  }

  if (profile.roles.includes("PARENT")) {
    res.status(200).json(await studentsService.listStudents({ ...query, idIn: await getOwnChildStudentIds(profile) }));
    return;
  }

  // CAMPUS_HEAD/OFFICE: well-defined as "every student across my campus(es)"
  // even without a section, unlike TEACHER/INCHARGE below.
  if (profile.campusIds.length > 0 && !query.sectionId) {
    res.status(200).json(await studentsService.listStudents({ ...query, campusIdIn: profile.campusIds }));
    return;
  }

  // TEACHER / INCHARGE (and CAMPUS_HEAD/OFFICE when a specific sectionId was
  // requested): no well-defined "all students in my scope" without a
  // section, same reasoning as resolveStudentScopeFilter.
  await assertSectionQueryInScope(profile, query.sectionId);
  res.status(200).json(await studentsService.listStudents(query));
}

export async function getStudentHandler(req: Request, res: Response): Promise<void> {
  const student = await studentsService.getStudent(req.params.studentId!);
  const profile = await getActorProfile(req.user!.id);
  await assertStudentInScope(profile, student.id);
  res.status(200).json(student);
}

export async function createStudentHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const student = await studentsService.createStudent(body, req.user!.id);
  res.status(201).json(student);
}

export async function updateStudentHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const student = await studentsService.updateStudent(req.params.studentId!, body, req.user!.id);
  res.status(200).json(student);
}

export async function withdrawStudentHandler(req: Request, res: Response): Promise<void> {
  const body = withdrawSchema.parse(req.body);
  const student = await studentsService.withdrawStudent(req.params.studentId!, body.reason, req.user!.id);
  res.status(200).json(student);
}

export async function archiveStudentHandler(req: Request, res: Response): Promise<void> {
  const student = await studentsService.archiveStudent(req.params.studentId!, req.user!.id);
  res.status(200).json(student);
}

const uploadMetaSchema = z.object({
  category: z.string().max(100).optional(),
  isSensitive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export async function uploadStudentDocumentHandler(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new HttpError(400, "NO_FILE", "No file uploaded (expected multipart field 'file')");
  }
  const meta = uploadMetaSchema.parse(req.body);
  const document = await studentsService.uploadStudentDocument(req.params.studentId!, req.file, meta, req.user!.id);
  res.status(201).json(document);
}

export async function listStudentDocumentsHandler(req: Request, res: Response): Promise<void> {
  const permissionKeys = await getUserPermissionKeys(req.user!.id);
  const documents = await studentsService.listStudentDocuments(req.params.studentId!, permissionKeys);
  res.status(200).json(documents);
}
