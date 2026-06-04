/** Edge-safe admin email check (no Prisma / NextAuth imports). */

export function getAdminEmail(): string | null {
  const raw = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return raw || null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = getAdminEmail();
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail;
}
