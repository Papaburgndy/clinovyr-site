export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordStrength = "weak" | "fair" | "strong" | "empty";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(email));
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  if (password.length < 8) return "weak";

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length >= 12 && variety >= 3) return "strong";
  if (password.length >= 8 && variety >= 2) return "fair";
  return "weak";
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password.length > 0 && password === confirm;
}
