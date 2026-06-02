import fs from "fs";
import { Resend } from "resend";
import { getPlaybookPdfPath } from "./playbook-data";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

const RESEND_SANDBOX_FROM = "Clinovyr <onboarding@resend.dev>";

export function getFromAddress(): string {
  if (process.env.RESEND_SANDBOX === "true" || !process.env.RESEND_FROM_EMAIL) {
    return RESEND_SANDBOX_FROM;
  }
  return process.env.RESEND_FROM_EMAIL;
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #d8d3ca;border-radius:4px;">
        <tr><td style="background:#0d0f12;padding:28px 32px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#f5f2ed;">Clinovyr</p>
          <p style="margin:8px 0 0;font-family:monospace;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Intelligence, Applied.</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#0d0f12;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendPlaybookDeliveryEmail(params: {
  to: string;
  industryLabel: string;
  playbookTitle: string;
  downloadUrl: string;
  pdfBuffer?: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { ok: false, error: "Email service is not configured." };
  }

  const resend = new Resend(resendApiKey);
  const body = `
    <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.6;">
      Thank you for purchasing <strong>${escapeHtml(params.playbookTitle)}</strong>.
      Your ${escapeHtml(params.industryLabel)} AI implementation playbook is ready.
    </p>
    <p style="margin:0 0 20px;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.6;">
      <a href="${escapeHtml(params.downloadUrl)}" style="display:inline-block;background:#1a6b5a;color:#f5f2ed;padding:12px 24px;text-decoration:none;border-radius:4px;font-family:system-ui,sans-serif;font-size:14px;">Download your playbook (PDF)</a>
    </p>
    <p style="margin:0;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">
      Questions about implementation? Reply to this email or contact
      <a href="mailto:clinovyr@gmail.com" style="color:#1a6b5a;">clinovyr@gmail.com</a>.
    </p>`;

  const attachments = params.pdfBuffer
    ? [
        {
          filename: `${params.industryLabel.toLowerCase().replace(/\s+/g, "-")}-playbook.pdf`,
          content: params.pdfBuffer,
        },
      ]
    : undefined;

  const result = await resend.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: `Your ${params.industryLabel} AI Playbook — Clinovyr`,
    html: emailShell("Your playbook is ready", body),
    attachments,
  });

  if (result.error) {
    console.error("[playbook-email] Resend error:", result.error);
    return { ok: false, error: result.error.message };
  }

  return { ok: true };
}

export function readPlaybookPdfBuffer(
  slug: string,
  version: number,
): Buffer | null {
  const pdfPath = getPlaybookPdfPath(slug, version);
  if (!fs.existsSync(pdfPath)) return null;
  return fs.readFileSync(pdfPath);
}
