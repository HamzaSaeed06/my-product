import crypto from "node:crypto";

// HMAC-SHA256 webhook signing — the same scheme a real payment gateway
// uses (Stripe, Easypaisa, JazzCash all sign callback payloads this way).
// The secret never leaves the server: PaymentGateway.webhookSecret is
// generated here and only ever used server-side, both when the
// (simulated) gateway signs its callback and when our webhook handler
// verifies it.
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function signGatewayPayload(secret: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

// Timing-safe comparison — a plain `===` on signatures is a timing side
// channel (spec rule: "Invalid callback signature -> rejected", which
// implies rejecting forged signatures matters enough to do this right).
export function verifyGatewaySignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = signGatewayPayload(secret, rawBody);
  const expectedBuf = Buffer.from(expected, "hex");
  let givenBuf: Buffer;
  try {
    givenBuf = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== givenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
