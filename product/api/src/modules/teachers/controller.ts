import type { Request, Response } from "express";
import { z } from "zod";
import * as teachersService from "./service.js";
import { getActorProfile } from "../../lib/scope.js";
import { HttpError } from "../../middleware/errorHandler.js";

const createSchema = z.object({
  userId: z.string().uuid(),
  employeeCode: z.string().max(50).optional(),
  qualification: z.string().max(200).optional(),
  joiningDate: z.coerce.date().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

const updateSchema = createSchema.omit({ userId: true }).partial();

const listQuerySchema = z.object({ campusId: z.string().uuid().optional() });

export async function listTeachersHandler(req: Request, res: Response): Promise<void> {
  const { campusId } = listQuerySchema.parse(req.query);
  const profile = await getActorProfile(req.user!.id);
  const campusIdIn = profile.campusIds.length > 0 ? profile.campusIds : campusId ? [campusId] : undefined;
  res.status(200).json(await teachersService.listTeachers(campusIdIn));
}

export async function createTeacherHandler(req: Request, res: Response): Promise<void> {
  const body = createSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  if (profile.campusIds.length > 0) {
    // Campus Head/Office may only turn a user into a Teacher profile if
    // that user's own TEACHER role is assigned at their campus — prevents
    // creating a Teacher profile for someone else's campus staff.
    const targetRoles = await teachersService.getUserCampusIdsForRole(body.userId, "TEACHER");
    if (!targetRoles.some((id) => profile.campusIds.includes(id))) {
      throw new HttpError(403, "OUT_OF_SCOPE", "That user's TEACHER role is not assigned to your campus");
    }
  }
  const teacher = await teachersService.createTeacher(body, req.user!.id);
  res.status(201).json(teacher);
}

// Verifies a campus-assigned actor (CAMPUS_HEAD/OFFICE) may act on this
// teacher — the teacher must hold their TEACHER role at one of the
// actor's own campuses. A Teacher with no campus-assigned TEACHER role
// yet (created but not campus-linked) is out of scope for anyone but
// SUPER_ADMIN, same "don't silently widen" rule as everywhere else in
// this file.
async function assertTeacherInCampusScope(profile: Awaited<ReturnType<typeof getActorProfile>>, teacherId: string) {
  if (profile.campusIds.length === 0) return;
  const teacherCampusIds = await teachersService.getTeacherCampusIds(teacherId);
  if (!teacherCampusIds.some((id) => profile.campusIds.includes(id))) {
    throw new HttpError(403, "OUT_OF_SCOPE", "You do not have access to this teacher");
  }
}

export async function updateTeacherHandler(req: Request, res: Response): Promise<void> {
  const body = updateSchema.parse(req.body);
  const profile = await getActorProfile(req.user!.id);
  await assertTeacherInCampusScope(profile, req.params.teacherId!);
  const teacher = await teachersService.updateTeacher(req.params.teacherId!, body, req.user!.id);
  res.status(200).json(teacher);
}

export async function archiveTeacherHandler(req: Request, res: Response): Promise<void> {
  const profile = await getActorProfile(req.user!.id);
  await assertTeacherInCampusScope(profile, req.params.teacherId!);
  const teacher = await teachersService.archiveTeacher(req.params.teacherId!, req.user!.id);
  res.status(200).json(teacher);
}
