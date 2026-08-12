import { createHash, randomBytes } from "node:crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function computeExpiry(ttlMinutes: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + ttlMinutes * 60 * 1000);
}
