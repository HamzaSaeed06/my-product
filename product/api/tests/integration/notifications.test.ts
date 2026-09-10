import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asSuperAdmin } from "./helpers.js";
import { prisma } from "../../src/lib/prisma.js";
import { createNotification } from "../../src/modules/notifications/service.js";

let notificationId: string | undefined;
let userId: string;

describe("Notifications API (real database)", () => {
  beforeAll(async () => {
    userId = asSuperAdmin().userId;
    const notification = await createNotification({
      userId,
      title: "Integration test notification",
      body: "hello",
    });
    notificationId = notification!.id;
  });

  afterAll(async () => {
    if (notificationId) {
      await prisma.notification.delete({ where: { id: notificationId } }).catch(() => {});
    }
    await prisma.notificationPreference.deleteMany({ where: { userId } });
  });

  it("lists my own notifications, most recent first", async () => {
    const res = await asSuperAdmin().get("/api/v1/notifications");
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe(notificationId);
    expect(res.body[0].readAt).toBeNull();
  });

  it("marks a notification as read", async () => {
    const res = await asSuperAdmin().post(`/api/v1/notifications/${notificationId}/read`);
    expect(res.status).toBe(200);
    expect(res.body.readAt).not.toBeNull();
  });

  it("refuses to mark someone else's notification as read", async () => {
    const res = await asSuperAdmin().post("/api/v1/notifications/00000000-0000-0000-0000-000000000000/read");
    expect(res.status).toBe(404);
  });

  it("reads and updates my notification preferences", async () => {
    const getRes = await asSuperAdmin().get("/api/v1/notifications/preferences");
    expect(getRes.status).toBe(200);
    expect(getRes.body.emailEnabled).toBe(true);

    const putRes = await asSuperAdmin()
      .put("/api/v1/notifications/preferences")
      .send({ emailEnabled: false });
    expect(putRes.status).toBe(200);
    expect(putRes.body.emailEnabled).toBe(false);
  });

  it("suppresses email notifications once opted out", async () => {
    const result = await createNotification({
      userId,
      title: "Should be suppressed",
      body: "...",
      channel: "EMAIL",
    });
    expect(result).toBeNull();
  });
});
