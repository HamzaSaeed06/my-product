import type { Request, Response } from "express";
import { z } from "zod";
import * as notificationsService from "./service.js";

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
});

export async function listMyNotificationsHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificationsService.listMyNotifications(req.user!.id));
}

export async function markAsReadHandler(req: Request, res: Response): Promise<void> {
  const notification = await notificationsService.markAsRead(req.params.notificationId!, req.user!.id);
  res.status(200).json(notification);
}

export async function getPreferencesHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await notificationsService.getMyPreferences(req.user!.id));
}

export async function updatePreferencesHandler(req: Request, res: Response): Promise<void> {
  const body = updatePreferencesSchema.parse(req.body);
  res.status(200).json(await notificationsService.updateMyPreferences(req.user!.id, body));
}
