import type { Request, Response } from "express";
import { z } from "zod";
import * as service from "./service.js";

const listQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]).optional(),
});

const generateSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  deploymentId: z.string().uuid(),
  expiresInDays: z.number().int().positive(),
});

export async function listLicensesHandler(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.status(200).json(await service.listLicenses(query));
}

export async function getLicenseHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.getLicense(req.params.licenseId!));
}

export async function generateLicenseHandler(req: Request, res: Response): Promise<void> {
  const body = generateSchema.parse(req.body);
  res.status(201).json(await service.generateLicense(body, req.providerUser!.id));
}

export async function activateLicenseHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.activateLicense(req.params.licenseId!, req.providerUser!.id));
}

export async function suspendLicenseHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.suspendLicense(req.params.licenseId!, req.providerUser!.id));
}

export async function revokeLicenseHandler(req: Request, res: Response): Promise<void> {
  res.status(200).json(await service.revokeLicense(req.params.licenseId!, req.providerUser!.id));
}
