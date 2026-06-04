import { Resend } from "resend";

const RESEND_SANDBOX_FROM = "Clinovyr <onboarding@resend.dev>";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getFromAddress(): string {
  if (process.env.RESEND_SANDBOX === "true" || !process.env.RESEND_FROM_EMAIL) {
    return RESEND_SANDBOX_FROM;
  }
  return process.env.RESEND_FROM_EMAIL;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function emailShell(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ed;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #d8d3ca;">
          <tr>
            <td style="background:#0d0f12;padding:28px 32px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:300;color:#f5f2ed;letter-spacing:-0.02em;">Clinovyr</p>
              <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Intelligence, Applied.</p>
            </td>
          </tr>
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmailHtml(data: {
  name: string;
  verifyUrl: string;
}): string {
  const content = `
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(data.name)},</p>
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Welcome to Clinovyr. Please verify your email address to activate your account and continue onboarding.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:4px;background:#1a6b5a;">
                    <a href="${escapeHtml(data.verifyUrl)}" style="display:inline-block;padding:12px 28px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;color:#f5f2ed;text-decoration:none;">Verify email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:13px;color:#7a7468;line-height:1.5;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
              <p style="margin:16px 0 0;font-family:'DM Mono',monospace;font-size:11px;color:#7a7468;word-break:break-all;">${escapeHtml(data.verifyUrl)}</p>
            </td>
          </tr>`;
  return emailShell(content);
}

export function buildPasswordResetEmailHtml(data: {
  name: string;
  resetUrl: string;
}): string {
  const content = `
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(data.name)},</p>
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">We received a request to reset your Clinovyr password. Click below to choose a new password.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:4px;background:#1a6b5a;">
                    <a href="${escapeHtml(data.resetUrl)}" style="display:inline-block;padding:12px 28px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;color:#f5f2ed;text-decoration:none;">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:13px;color:#7a7468;line-height:1.5;">This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.</p>
            </td>
          </tr>`;
  return emailShell(content);
}

export async function sendAuthEmail(options: {
  to: string;
  subject: string;
  html: string;
  bcc?: string | string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("Auth email: missing RESEND_API_KEY");
    return { ok: false, error: "Email service is not configured." };
  }

  const resend = new Resend(resendApiKey);
  const bcc =
    options.bcc === undefined
      ? undefined
      : Array.isArray(options.bcc)
        ? options.bcc
        : [options.bcc];

  const result = await resend.emails.send({
    from: getFromAddress(),
    to: options.to,
    ...(bcc?.length ? { bcc } : {}),
    subject: options.subject,
    html: options.html,
  });

  if (result.error) {
    console.error("Auth email: Resend error", result.error);
    return { ok: false, error: "Failed to send email." };
  }

  return { ok: true };
}
