// Bootstraps the very first Super Admin user. There is no self-registration
// for this role by design (spec: Super Admin is a system administrator, not
// a signup flow) — run this once against a fresh database.
//
// Usage:
//   npm run create-super-admin --workspace=product/api -- --email you@school.com --password "Str0ng!Pass" --name "Your Name"

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword, isPasswordPolicyCompliant } from "../src/lib/password.js";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main(): Promise<void> {
  const email = getArg("email");
  const password = getArg("password");
  const name = getArg("name") ?? "Super Admin";

  if (!email || !password) {
    console.error('Usage: --email you@school.com --password "Str0ng!Pass" [--name "Your Name"]');
    process.exitCode = 1;
    return;
  }

  if (!isPasswordPolicyCompliant(password)) {
    console.error(
      "Password must be at least 8 characters and include upper, lower, number, and special character."
    );
    process.exitCode = 1;
    return;
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!superAdminRole) {
    console.error('SUPER_ADMIN role not found — run "npm run prisma:seed" first.');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`A user with email ${email} already exists.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: name,
      userRoles: { create: { roleId: superAdminRole.id } },
    },
  });

  console.log(`Super Admin created: ${user.email} (${user.id})`);
  console.log("MFA is not yet enabled for this account — enable it via /api/v1/auth/mfa/setup after first login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
