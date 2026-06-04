import { randomBytes } from "crypto";

export const VERIFICATION_EXPIRY_HOURS = 24;
export const RESET_EXPIRY_HOURS = 1;

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function verificationExpiresAt(): Date {
  return new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
}

export function resetExpiresAt(): Date {
  return new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);
}

export const RESET_IDENTIFIER_PREFIX = "reset:";

export function resetIdentifier(email: string): string {
  return `${RESET_IDENTIFIER_PREFIX}${email}`;
}

export function isResetIdentifier(identifier: string): boolean {
  return identifier.startsWith(RESET_IDENTIFIER_PREFIX);
}
