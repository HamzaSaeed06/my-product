import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";

export async function listFeeCategories() {
  return prisma.feeCategory.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } });
}

export async function createFeeCategory(input: { instituteId: string; name: string }, actorId: string) {
  try {
    const category = await prisma.feeCategory.create({ data: input });

    await writeAuditLog({ actorId, action: "CREATE", resource: "FeeCategory", recordId: category.id, newValue: input });

    return category;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HttpError(409, "FEE_CATEGORY_EXISTS", "A fee category with this name already exists");
    }
    throw err;
  }
}

export async function archiveFeeCategory(id: string, actorId: string) {
  const category = await prisma.feeCategory.findUnique({ where: { id } });
  if (!category) throw new HttpError(404, "FEE_CATEGORY_NOT_FOUND", "Fee category not found");
  if (category.archivedAt) throw new HttpError(409, "ALREADY_ARCHIVED", "Fee category already archived");

  const updated = await prisma.feeCategory.update({ where: { id }, data: { archivedAt: new Date() } });

  await writeAuditLog({ actorId, action: "ARCHIVE", resource: "FeeCategory", recordId: id, newValue: { archivedAt: updated.archivedAt } });

  return updated;
}
