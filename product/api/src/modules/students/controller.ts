import type { Request, Response } from "express";
import { z } from "zod";
import * as studentsService from "./service.js";
import { getUserPermissionKeys } from "../../middleware/authorize.js";
import { HttpError } from "../../middleware/errorHandler.js";

const statusEnum = z.enum(["ACTIVE", "WITHDRAWN", "ARCHIVED"]);

const createSchema = z.object({
  fullName: z.string().min(1).max(200),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().max(30).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

const withdrawSchema = z.object({ reason: z.string().max(500).optional() });

export async function searchStudentsHandler(req: Request, res: Response): Promise<void> {
  const q = z.string().default("").parse(req.query.q ?? "");
  res.status(200).json(await studentsService.searchStudents(q));
}

export async function listStudentsHandler(req: Request, res: Response): Promise<void> {
  const status = statusEnum.optional().parse(req.query.status);
  res.status(200).json(await studentsService.listStudents({ status }));
}

export async function getStudentHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await studentsService.getStudent(req.params.studentId!));
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
