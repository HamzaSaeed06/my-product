// Bootstraps the very first provider-platform staff account. No self-
// registration by design — run this once against a fresh provider schema.
//
// Usage:
//   npm run create-provider-admin --workspace=provider/api -- --email you@yourcompany.com --password "Str0ng!Pass" --name "Your Name"

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main(): Promise<void> {
  const email = getArg("email");
  const password = getArg("password");
  const name = getArg("name") ?? "Provider Admin";

  if (!email || !password) {
    console.error('Usage: --email you@yourcompany.com --password "Str0ng!Pass" [--name "Your Name"]');
    process.exitCode = 1;
    return;
  }

  if (!PASSWORD_POLICY.test(password)) {
    console.error("Password must be at least 8 characters and include upper, lower, number, and special character.");
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.providerUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`A provider user with email ${email} already exists.`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.providerUser.create({ data: { email, passwordHash, fullName: name } });

  console.log(`Provider admin created: ${user.email} (${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
