import type { FeatureConfigPolicyMode } from "@prisma/client";
import { prisma } from "./prisma.js";
import { HttpError } from "../middleware/errorHandler.js";

// Phase 12 Gap 3 — the Mandatory/Institute-Default/Campus-Controlled model
// generalized to any feature, mirroring Google Cloud's Organization Policy
// hierarchy (enforced / inherited-with-override / independently-managed).
// One resolution function every feature reads through instead of
// duplicating this logic per feature.

export interface ResolvedFeatureConfig {
  policyMode: FeatureConfigPolicyMode;
  value: unknown;
  source: "institute" | "campus";
}

async function getInstituteRow(instituteId: string, featureKey: string) {
  // Postgres treats NULL as distinct in a unique index, so the schema's
  // @@unique([instituteId, campusId, featureKey]) does NOT stop two
  // campusId: null rows for the same key existing — this find-before-write
  // pattern is what actually keeps "exactly one institute-level row per
  // featureKey" true. Same class of gotcha this codebase hit before with
  // another nullable-field compound key.
  return prisma.featureConfig.findFirst({ where: { instituteId, campusId: null, featureKey } });
}

export async function resolveFeatureConfig(
  instituteId: string,
  campusId: string | null,
  featureKey: string
): Promise<ResolvedFeatureConfig> {
  const instituteRow = await getInstituteRow(instituteId, featureKey);
  if (!instituteRow || !instituteRow.policyMode) {
    throw new HttpError(
      500,
      "FEATURE_CONFIG_NOT_SEEDED",
      `No institute-level FeatureConfig row exists for '${featureKey}' — it must be seeded at institute-setup time`
    );
  }

  if (instituteRow.policyMode === "MANDATORY" || !campusId) {
    return { policyMode: instituteRow.policyMode, value: instituteRow.valueJson, source: "institute" };
  }

  const campusRow = await prisma.featureConfig.findUnique({
    where: { instituteId_campusId_featureKey: { instituteId, campusId, featureKey } },
  });

  if (!campusRow) {
    // Per the design: a CAMPUS_CONTROLLED feature should have its campus
    // row seeded at campus-creation time so this never actually fires;
    // falling back to the institute value rather than throwing keeps a
    // missed seed from taking down the feature entirely.
    return { policyMode: instituteRow.policyMode, value: instituteRow.valueJson, source: "institute" };
  }

  return { policyMode: instituteRow.policyMode, value: campusRow.valueJson, source: "campus" };
}

export async function setInstituteFeatureConfig(
  instituteId: string,
  featureKey: string,
  policyMode: FeatureConfigPolicyMode,
  valueJson: unknown
) {
  const existing = await getInstituteRow(instituteId, featureKey);
  return existing
    ? prisma.featureConfig.update({ where: { id: existing.id }, data: { policyMode, valueJson: valueJson as object } })
    : prisma.featureConfig.create({ data: { instituteId, campusId: null, featureKey, policyMode, valueJson: valueJson as object } });
}

export async function setCampusFeatureConfig(instituteId: string, campusId: string, featureKey: string, valueJson: unknown) {
  const instituteRow = await getInstituteRow(instituteId, featureKey);
  if (!instituteRow) throw new HttpError(404, "FEATURE_CONFIG_NOT_FOUND", `No institute-level FeatureConfig row exists for '${featureKey}'`);
  if (instituteRow.policyMode === "MANDATORY") {
    throw new HttpError(403, "FEATURE_POLICY_MANDATORY", `'${featureKey}' is mandatory institute-wide and cannot be overridden per campus`);
  }

  return prisma.featureConfig.upsert({
    where: { instituteId_campusId_featureKey: { instituteId, campusId, featureKey } },
    update: { valueJson: valueJson as object },
    create: { instituteId, campusId, featureKey, valueJson: valueJson as object },
  });
}
