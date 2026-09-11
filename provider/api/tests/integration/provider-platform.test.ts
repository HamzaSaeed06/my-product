import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { loginAsProviderUser, uniqueSuffix } from "./helpers.js";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { hashPassword } from "../../src/lib/password.js";
import { LICENSE_PUBLIC_KEY_PEM, computeLicenseState } from "../../src/lib/license.js";
import jwt from "jsonwebtoken";

const suffix = uniqueSuffix();
const app = createApp();
let admin: Awaited<ReturnType<typeof loginAsProviderUser>>;
let adminUserId: string | undefined;

let customerId: string | undefined;
let planId: string | undefined;
let deploymentId: string | undefined;
let heartbeatToken: string | undefined;
const licenseIds: string[] = [];
let ticketId: string | undefined;

describe("Provider Platform (real database)", () => {
  beforeAll(async () => {
    const email = `provider.test.${suffix}@example.com`;
    const passwordHash = await hashPassword("Str0ng!Passw0rd");
    const user = await prisma.providerUser.create({ data: { email, passwordHash, fullName: `Test Admin ${suffix}` } });
    adminUserId = user.id;
    admin = await loginAsProviderUser(email, "Str0ng!Passw0rd");
  });

  afterAll(async () => {
    if (ticketId) await prisma.supportTicket.delete({ where: { id: ticketId } }).catch(() => {});
    for (const id of licenseIds) {
      await prisma.license.delete({ where: { id } }).catch(() => {});
    }
    if (deploymentId) await prisma.deployment.delete({ where: { id: deploymentId } }).catch(() => {});
    if (planId) await prisma.plan.delete({ where: { id: planId } }).catch(() => {});
    if (customerId) await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
    if (adminUserId) {
      await prisma.session.deleteMany({ where: { providerUserId: adminUserId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { actorId: adminUserId } }).catch(() => {});
      await prisma.providerUser.delete({ where: { id: adminUserId } }).catch(() => {});
    }
  });

  it("1. auth: /me reflects the logged-in provider user", async () => {
    const res = await admin.get("/api/v1/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(adminUserId);
  });

  it("2. customer management: create, list, update, deactivate", async () => {
    const createRes = await admin.post("/api/v1/customers").send({
      name: `Test Customer ${suffix}`,
      contactName: "Jane Doe",
      contactEmail: `jane.${suffix}@example.com`,
      contactPhone: "03001234567",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.customerCode).toMatch(/^CUST-\d{4}-\d{6}$/);
    customerId = createRes.body.id;

    const listRes = await admin.get("/api/v1/customers");
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((c: { id: string }) => c.id === customerId)).toBe(true);

    const updateRes = await admin.patch(`/api/v1/customers/${customerId}`).send({ notes: "VIP customer" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.notes).toBe("VIP customer");

    const statusRes = await admin.post(`/api/v1/customers/${customerId}/status`).send({ status: "INACTIVE" });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe("INACTIVE");

    await admin.post(`/api/v1/customers/${customerId}/status`).send({ status: "ACTIVE" });
  });

  it("3. plan management: create a plan", async () => {
    const res = await admin.post("/api/v1/plans").send({
      name: `Professional ${suffix}`,
      tier: `professional-${suffix}`,
      features: ["online_payments", "parent_portal"],
      maxStudents: 1000,
      maxCampuses: 3,
      maxStaff: 100,
      maxStorageMb: 10240,
    });
    expect(res.status).toBe(201);
    planId = res.body.id;
    expect(res.body.isActive).toBe(true);
  });

  it("4. deployment tracking: create a deployment, get a heartbeat token exactly once", async () => {
    const res = await admin.post("/api/v1/deployments").send({
      customerId,
      version: "1.0.0",
      url: "https://smoketest.example.edu",
    });
    expect(res.status).toBe(201);
    deploymentId = res.body.id;
    heartbeatToken = res.body.heartbeatToken;
    expect(heartbeatToken).toBeTruthy();

    const getRes = await admin.get(`/api/v1/deployments/${deploymentId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.heartbeatToken).toBeUndefined();
  });

  it("5. license generation: signed JWT verifies with the embedded public key, matches spec's claim shape", async () => {
    const res = await admin.post("/api/v1/licenses").send({ customerId, planId, deploymentId, expiresInDays: 365 });
    expect(res.status).toBe(201);
    licenseIds.push(res.body.id);
    expect(res.body.state).toBe("VALID");

    const decoded = jwt.verify(res.body.signedJwt, LICENSE_PUBLIC_KEY_PEM, { algorithms: ["RS256"] }) as Record<string, unknown>;
    expect(decoded.sub).toBe(customerId);
    expect(decoded.deploymentId).toBe(deploymentId);
    expect(decoded.plan).toBe(`professional-${suffix}`);
    expect(decoded.features).toEqual(["online_payments", "parent_portal"]);
    expect(decoded.limits).toEqual({ maxStudents: 1000, maxCampuses: 3, maxStaff: 100, maxStorage: 10240 });

    const getRes = await admin.get(`/api/v1/licenses/${res.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.signedJwt).toBeUndefined();
  });

  it("6. license state transitions: activate/suspend/revoke, revoked is terminal", async () => {
    const licenseId = licenseIds[0]!;

    const suspendRes = await admin.post(`/api/v1/licenses/${licenseId}/suspend`);
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.state).toBe("SUSPENDED");

    const reactivateRes = await admin.post(`/api/v1/licenses/${licenseId}/activate`);
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.state).toBe("VALID");

    const revokeRes = await admin.post(`/api/v1/licenses/${licenseId}/revoke`);
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.state).toBe("REVOKED");

    const cannotReactivate = await admin.post(`/api/v1/licenses/${licenseId}/activate`);
    expect(cannotReactivate.status).toBe(409);
    expect(cannotReactivate.body.error).toBe("LICENSE_REVOKED");
  });

  it("7. license state computation matches spec's day-threshold table (pure function, no I/O)", () => {
    const day = 24 * 60 * 60 * 1000;
    const now = new Date("2026-06-01T00:00:00Z");
    expect(computeLicenseState("ACTIVE", new Date(now.getTime() + 40 * day), now)).toBe("VALID");
    expect(computeLicenseState("ACTIVE", new Date(now.getTime() + 20 * day), now)).toBe("EXPIRING_SOON");
    expect(computeLicenseState("ACTIVE", new Date(now.getTime() + 3 * day), now)).toBe("EXPIRING_CRITICAL");
    expect(computeLicenseState("ACTIVE", new Date(now.getTime() - 10 * day), now)).toBe("EXPIRED_GRACE");
    expect(computeLicenseState("ACTIVE", new Date(now.getTime() - 40 * day), now)).toBe("EXPIRED_FINAL");
    expect(computeLicenseState("SUSPENDED", new Date(now.getTime() + 40 * day), now)).toBe("SUSPENDED");
    expect(computeLicenseState("REVOKED", new Date(now.getTime() + 40 * day), now)).toBe("REVOKED");
  });

  it("8. heartbeat: valid token records a HealthCheck, updates Deployment health, reports license validity", async () => {
    const licRes = await admin.post("/api/v1/licenses").send({ customerId, planId, deploymentId, expiresInDays: 30 });
    expect(licRes.status).toBe(201);
    licenseIds.push(licRes.body.id);

    const hbRes = await request(app)
      .post("/api/v1/heartbeat")
      .set("Authorization", `Bearer ${heartbeatToken}`)
      .send({
        deploymentId,
        version: "1.0.1",
        timestamp: new Date().toISOString(),
        metrics: {
          uptime: 2592000,
          studentCount: 847,
          staffCount: 52,
          campusCount: 2,
          storageUsed: 4096,
          apiStatus: "healthy",
          dbStatus: "healthy",
          avgResponseTime: 145,
          errorRate: 0.2,
        },
      });

    expect(hbRes.status).toBe(200);
    expect(hbRes.body.success).toBe(true);
    expect(hbRes.body.license.valid).toBe(true);
    expect(hbRes.body.license.expiresIn).toBeGreaterThan(0);

    const deploymentRes = await admin.get(`/api/v1/deployments/${deploymentId}`);
    expect(deploymentRes.body.healthStatus).toBe("HEALTHY");
    expect(deploymentRes.body.version).toBe("1.0.1");
    expect(deploymentRes.body.lastCheckInAt).not.toBeNull();
    expect(deploymentRes.body.healthChecks.length).toBeGreaterThan(0);
  });

  it("9. heartbeat: an invalid bearer token is rejected", async () => {
    const res = await request(app)
      .post("/api/v1/heartbeat")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ deploymentId, version: "1.0.1", metrics: { uptime: 1, studentCount: 1, staffCount: 1, campusCount: 1, storageUsed: 1, apiStatus: "healthy", dbStatus: "healthy", avgResponseTime: 1, errorRate: 0 } });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("INVALID_HEARTBEAT_TOKEN");
  });

  it("10. heartbeat: a mismatched deploymentId in the payload is rejected even with a valid token", async () => {
    const res = await request(app)
      .post("/api/v1/heartbeat")
      .set("Authorization", `Bearer ${heartbeatToken}`)
      .send({ deploymentId: "00000000-0000-0000-0000-000000000000", version: "1.0.1", metrics: { uptime: 1, studentCount: 1, staffCount: 1, campusCount: 1, storageUsed: 1, apiStatus: "healthy", dbStatus: "healthy", avgResponseTime: 1, errorRate: 0 } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("DEPLOYMENT_ID_MISMATCH");
  });

  it("11. support tickets: create, assign, resolve", async () => {
    const createRes = await admin.post("/api/v1/support-tickets").send({
      customerId,
      subject: "Cannot log in",
      description: "Getting a 500 error on login",
      priority: "HIGH",
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.ticketNumber).toMatch(/^TCK-\d{4}-\d{6}$/);
    expect(createRes.body.status).toBe("OPEN");
    ticketId = createRes.body.id;

    const assignRes = await admin.post(`/api/v1/support-tickets/${ticketId}/assign`).send({ assignedToId: adminUserId });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.assignedToId).toBe(adminUserId);
    expect(assignRes.body.status).toBe("IN_PROGRESS");

    const resolveRes = await admin.post(`/api/v1/support-tickets/${ticketId}/resolve`);
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe("RESOLVED");
    expect(resolveRes.body.resolvedAt).not.toBeNull();
  });

  it("12. dashboard: aggregates reflect what was just created", async () => {
    const res = await admin.get("/api/v1/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.customers.total).toBeGreaterThanOrEqual(1);
    expect(res.body.licenses.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.deploymentHealth)).toBe(true);
    expect(Array.isArray(res.body.support.byStatus)).toBe(true);
  });
});
