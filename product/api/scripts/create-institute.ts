// Bootstraps the single Institute row for this deployment. Institute is a
// singleton by convention (product/api/src/modules/institute/service.ts
// refuses a second create) — run this once, early, before campuses/academic
// years/classes can be created (they all require an Institute to exist).
//
// Usage:
//   npm run create-institute --workspace=product/api -- --name "Your School Name" [--type SCHOOL]

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedTerminologyPresetForType } from "../src/lib/terminology.js";
import { setInstituteFeatureConfig } from "../src/lib/featureConfig.js";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const VALID_TYPES = ["SCHOOL", "ACADEMY", "COACHING_CENTER", "INSTITUTE"] as const;

async function main(): Promise<void> {
  const name = getArg("name");
  const type = (getArg("type") ?? "SCHOOL").toUpperCase();

  if (!name) {
    console.error('Usage: --name "Your School Name" [--type SCHOOL|ACADEMY|COACHING_CENTER|INSTITUTE]');
    process.exitCode = 1;
    return;
  }
  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    console.error(`--type must be one of: ${VALID_TYPES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.institute.findFirst();
  if (existing) {
    console.error(`An institute is already configured: "${existing.name}" (${existing.id})`);
    process.exitCode = 1;
    return;
  }

  // Phase 12 Gap 4: never force a single-campus institution through a
  // "create your first campus" step — same as the API's createInstitute().
  const institute = await prisma.institute.create({
    data: {
      name,
      type: type as (typeof VALID_TYPES)[number],
      settings: { create: {} },
      campuses: { create: [{ name: "Main Campus" }] },
    },
  });

  await seedTerminologyPresetForType(institute.id, institute.type);
  await setInstituteFeatureConfig(institute.id, "ATTENDANCE_CHECKIN_METHODS", "INSTITUTE_DEFAULT", {
    allowedMethods: ["QR", "MANUAL", "REMOTE_APPROVED"],
  });

  console.log(`Institute created: ${institute.name} (${institute.id})`);
  console.log(`Default campus "Main Campus" created — rename it any time via PATCH /api/v1/campuses/:id.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
