import { prisma } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { HttpError } from "../../middleware/errorHandler.js";
import { generateLicenseNumber } from "../../lib/providerCodes.js";
import { signLicense, computeLicenseState, type LicenseState } from "../../lib/license.js";

function include() {
  return {
    customer: { select: { id: true, name: true, customerCode: true } },
    plan: true,
    deployment: { select: { id: true, url: true, version: true, status: true } },
  };
}

// signedJwt is write-once from this API's perspective — returned in full
// only right after generate(); every other read omits it (the raw JWT
// string is a bearer credential a customer's LICENSE_JWT env var holds,
// no reason to keep re-serving it over the provider dashboard's list/get).
function withoutSignedJwt<T extends { signedJwt: string }>(license: T): Omit<T, "signedJwt"> {
  const { signedJwt, ...rest } = license;
  return rest;
}

export interface LicenseWithState {
  state: LicenseState;
}

export async function listLicenses(filter: { customerId?: string; status?: string }) {
  const licenses = await prisma.license.findMany({
    where: { customerId: filter.customerId, status: filter.status as never },
    include: include(),
    orderBy: { createdAt: "desc" },
  });
  return licenses.map((l) => ({ ...withoutSignedJwt(l), state: computeLicenseState(l.status, l.expiresAt) }));
}

export async function getLicense(id: string) {
  const license = await prisma.license.findUnique({ where: { id }, include: include() });
  if (!license) throw new HttpError(404, "LICENSE_NOT_FOUND", "License not found");
  return { ...withoutSignedJwt(license), state: computeLicenseState(license.status, license.expiresAt) };
}

export async function generateLicense(
  input: { customerId: string; planId: string; deploymentId: string; expiresInDays: number },
  actorId: string
) {
  const [customer, plan, deployment] = await Promise.all([
    prisma.customer.findUnique({ where: { id: input.customerId } }),
    prisma.plan.findUnique({ where: { id: input.planId } }),
    prisma.deployment.findUnique({ where: { id: input.deploymentId } }),
  ]);
  if (!customer) throw new HttpError(400, "CUSTOMER_NOT_FOUND", "Customer not found");
  if (!plan) throw new HttpError(400, "PLAN_NOT_FOUND", "Plan not found");
  if (!deployment) throw new HttpError(400, "DEPLOYMENT_NOT_FOUND", "Deployment not found");
  if (deployment.customerId !== customer.id) {
    throw new HttpError(400, "DEPLOYMENT_CUSTOMER_MISMATCH", "This deployment does not belong to this customer");
  }
  if (input.expiresInDays <= 0) throw new HttpError(400, "INVALID_EXPIRY", "expiresInDays must be positive");

  const licenseNumber = await generateLicenseNumber();
  const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

  // licenseId (the `lic` claim) is generated up front so it can be embedded
  // in the JWT payload before the row exists — the License row's own id
  // becomes that same value once created.
  const licenseId = licenseNumber;
  const { signedJwt, jti } = signLicense({
    customerId: customer.id,
    licenseId,
    plan: plan.tier,
    features: plan.features,
    limits: { maxStudents: plan.maxStudents, maxCampuses: plan.maxCampuses, maxStaff: plan.maxStaff, maxStorage: plan.maxStorageMb },
    deploymentId: deployment.id,
    deploymentUrl: deployment.url,
    expiresAt,
  });

  const license = await prisma.license.create({
    data: {
      licenseNumber,
      customerId: customer.id,
      planId: plan.id,
      deploymentId: deployment.id,
      jti,
      expiresAt,
      signedJwt,
    },
    include: include(),
  });

  await writeAuditLog({
    actorId,
    action: "CREATE",
    resource: "License",
    recordId: license.id,
    newValue: { licenseNumber, customerId: customer.id, planId: plan.id, expiresAt: expiresAt.toISOString() },
  });

  // The one and only time signedJwt is returned in full — the caller must
  // deliver it to the customer now (per spec's "Provider delivers new
  // LICENSE_JWT to customer" renewal step).
  return { ...license, state: computeLicenseState(license.status, license.expiresAt) };
}

async function setLicenseStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "REVOKED", actorId: string) {
  const license = await prisma.license.findUnique({ where: { id } });
  if (!license) throw new HttpError(404, "LICENSE_NOT_FOUND", "License not found");
  if (license.status === "REVOKED") throw new HttpError(409, "LICENSE_REVOKED", "A revoked license cannot change status");

  const updated = await prisma.license.update({ where: { id }, data: { status }, include: include() });
  await writeAuditLog({ actorId, action: "UPDATE", resource: "License", recordId: id, newValue: { status } });
  return { ...withoutSignedJwt(updated), state: computeLicenseState(updated.status, updated.expiresAt) };
}

export function activateLicense(id: string, actorId: string) {
  return setLicenseStatus(id, "ACTIVE", actorId);
}
export function suspendLicense(id: string, actorId: string) {
  return setLicenseStatus(id, "SUSPENDED", actorId);
}
export function revokeLicense(id: string, actorId: string) {
  return setLicenseStatus(id, "REVOKED", actorId);
}
