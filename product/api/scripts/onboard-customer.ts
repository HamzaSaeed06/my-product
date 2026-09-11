// Bootstraps a brand-new customer deployment in one command: migrate the
// database, seed roles/permissions, create the Institute, create the first
// Super Admin login. Each of these already exists as its own standalone
// script (prisma:migrate/prisma:seed/create-institute/create-super-admin) —
// this just runs them in the right order, stopping on the first failure,
// so a fresh customer server needs exactly one command instead of four.
// Every step is safe to re-run individually afterward if something needs
// fixing (migrate deploy and the seed are both idempotent; create-institute
// and create-super-admin simply refuse a second run — see their own files).
//
// Usage (run this ON THE CUSTOMER'S OWN SERVER, against THEIR OWN
// DATABASE_URL — never from the provider platform, which by design has no
// access to any customer's database):
//   npm run onboard-customer --workspace=product/api -- \
//     --institute-name "Riverside School" \
//     --admin-email admin@riverside.edu.pk \
//     --admin-password "Str0ng!Passw0rd" \
//     --admin-name "Riverside Admin"

import { execSync } from "node:child_process";
import path from "node:path";

const apiRoot = path.resolve(import.meta.dirname, "..");

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

// A shell (needed to run npx/tsx as .cmd shims on Windows) does NOT quote
// array-style args for you — confirmed the hard way: an unquoted
// --institute-name "Riverside Test School" silently became argv "Riverside",
// "Test", "School" as three separate entries, and the downstream script's
// getArg() only ever reads the one immediately after the flag. Every
// argument gets explicitly quoted here instead of trusting the shell to do
// it; double quotes work under both cmd.exe and POSIX sh for the plain
// names/emails/passwords this script actually receives.
function quote(arg: string): string {
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function run(label: string, command: string, args: string[]): void {
  console.log(`\n=== ${label} ===`);
  const commandLine = [command, ...args.map(quote)].join(" ");
  execSync(commandLine, { cwd: apiRoot, stdio: "inherit" });
}

function main(): void {
  const instituteName = getArg("institute-name");
  const instituteType = getArg("institute-type") ?? "SCHOOL";
  const adminEmail = getArg("admin-email");
  const adminPassword = getArg("admin-password");
  const adminName = getArg("admin-name") ?? "Super Admin";

  if (!instituteName || !adminEmail || !adminPassword) {
    console.error(
      'Usage: --institute-name "Your School Name" --admin-email you@school.com --admin-password "Str0ng!Pass" [--admin-name "Your Name"] [--institute-type SCHOOL]'
    );
    process.exitCode = 1;
    return;
  }

  run("1/4 Running database migrations", "npx", ["prisma", "migrate", "deploy"]);
  run("2/4 Seeding roles & permissions", "npx", ["tsx", "prisma/seed.ts"]);
  run("3/4 Creating institute", "npx", ["tsx", "scripts/create-institute.ts", "--", "--name", instituteName, "--type", instituteType]);
  run("4/4 Creating Super Admin", "npx", [
    "tsx",
    "scripts/create-super-admin.ts",
    "--",
    "--email",
    adminEmail,
    "--password",
    adminPassword,
    "--name",
    adminName,
  ]);

  console.log(`\nDone. Log in as ${adminEmail} to finish setup (campuses, academic year, classes, ...).`);
}

main();
