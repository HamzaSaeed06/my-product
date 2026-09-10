import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errorHandler.js";
import type { NotificationChannel } from "@prisma/client";

// Called by other modules (Phase 6 leave/complaints, Phase 3 attendance,
// etc.) to notify a user — not exposed as a public "create notification for
// anyone" route. In-app notifications are fully functional; EMAIL delivery
// is a TODO (no SMTP/email provider has been chosen yet — see
// docs/PROJECT_STATUS.md). We still create the Notification row for EMAIL
// channel so nothing is silently lost once a real sender is wired in.
export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  channel?: NotificationChannel;
}) {
  const preference = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });
  const channel = input.channel ?? "IN_APP";

  if (channel === "EMAIL" && preference?.emailEnabled === false) {
    return null; // user opted out of email
  }
  if (channel === "IN_APP" && preference?.inAppEnabled === false) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: { userId: input.userId, title: input.title, body: input.body, channel },
  });

  if (channel === "EMAIL") {
    // TODO(Phase 0 follow-up): wire an actual email provider. Logging only
    // for now so nothing pretends to have sent an email that wasn't sent.
    console.log(`[email stub] would send to user ${input.userId}: ${input.title}`);
  }

  return notification;
}

export async function listMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw new HttpError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  }

  return prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}

export async function getMyPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.notificationPreference.create({ data: { userId } });
}

export async function updateMyPreferences(
  userId: string,
  input: { emailEnabled?: boolean; inAppEnabled?: boolean }
) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}
