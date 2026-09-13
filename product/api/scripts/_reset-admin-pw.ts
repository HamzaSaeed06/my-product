// Disposable: reset a super-admin password to a known value for E2E login. Delete after use.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();
(async () => {
  const admins = await prisma.user.findMany({
    where: { userRoles: { some: { role: { systemKey: "SUPER_ADMIN" } } } },
    select: { id: true, email: true },
  });
  console.log("super admins:", admins.map((a) => a.email));
  const target = admins.find((a) => a.email === "admin@myproduct.local") ?? admins[0];
  if (!target) {
    console.log("NO SUPER ADMIN FOUND");
  } else {
    await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await hashPassword("Verify123!Pass"), isActive: true } });
    console.log("RESET:", target.email, "/ Verify123!Pass");
  }
  await prisma.$disconnect();
})();
