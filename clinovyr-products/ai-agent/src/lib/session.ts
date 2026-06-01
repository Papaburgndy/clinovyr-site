const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const SUSPICIOUS_SESSION_PATTERN =
  /drop|delete|insert|update|select|union|script|--/i;

export function sanitizeSessionId(sessionId: string): string {
  const stripped = sessionId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!stripped || stripped.length > 128) {
    return stripped.slice(0, 128) || "anonymous";
  }
  return stripped;
}

export function isValidSessionId(sessionId: string): boolean {
  return SESSION_ID_PATTERN.test(sessionId);
}

export function normalizeSessionId(sessionId: string | undefined): string {
  if (!sessionId || typeof sessionId !== "string") {
    return `sess_${Date.now()}`;
  }
  const sanitized = sanitizeSessionId(sessionId);
  if (
    !isValidSessionId(sanitized) ||
    SUSPICIOUS_SESSION_PATTERN.test(sanitized) ||
    sanitized !== sessionId.replace(/[^a-zA-Z0-9_-]/g, "")
  ) {
    return `sess_${Date.now()}`;
  }
  return sanitized;
}
