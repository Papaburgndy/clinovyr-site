import { Resend } from "resend";
import type { AssessmentFormData } from "@/lib/assessment-types";
import { logResendApiKeyLoaded } from "@/lib/env-check";
import type { AIReadinessScore } from "@/lib/scoring";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://clinovyr.com";
  return url.replace(/\/$/, "");
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Clinovyr <reports@clinovyr.com>";
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
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
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#0d0f12;">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildInternalAssessmentEmailHtml(params: {
  formData: AssessmentFormData;
  score: AIReadinessScore;
  assessmentId: string;
  reportUrl: string;
}): string {
  const { formData, score, assessmentId, reportUrl } = params;
  const contactName = `${formData.firstName} ${formData.lastName}`;

  const rows = [
    ["Company", formData.companyName],
    ["Industry", formData.industry],
    ["Contact", contactName],
    ["Email", formData.email],
    ["Phone", formData.phone],
    ["Overall Score", `${score.overallScore}/100`],
    ["Tier", score.tier],
    ["Recommended Package", score.recommendedPackage],
    ["Assessment ID", assessmentId],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #d8d3ca;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7468;width:160px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #d8d3ca;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.5;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <p style="margin:0 0 20px;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">A new AI Readiness Assessment was submitted.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tableRows}</table>
    <p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.5;">
      Generate the full PDF report (POST):<br>
      <a href="${escapeHtml(reportUrl)}" style="color:#1a6b5a;">${escapeHtml(reportUrl)}</a>
    </p>
    <p style="margin:12px 0 0;font-family:monospace;font-size:12px;color:#7a7468;">Body: { "assessmentId": "${escapeHtml(assessmentId)}" }</p>`;

  return emailShell("New AI Readiness Assessment", body);
}

export function buildClientConfirmationEmailHtml(params: {
  formData: AssessmentFormData;
  score: AIReadinessScore;
}): string {
  const { formData, score } = params;
  const firstName = formData.firstName;

  const body = `
    <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.6;">
      Thank you for completing the Clinovyr AI Readiness Assessment for <strong>${escapeHtml(formData.companyName)}</strong>.
      Your personalized report is being prepared — we will send it within 24 hours.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#ede9e2;border-radius:4px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7468;">Your readiness score</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:36px;color:#1a6b5a;">${score.overallScore}<span style="font-size:18px;color:#7a7468;">/100</span></p>
          <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;"><strong>Tier:</strong> ${escapeHtml(score.tier)}</p>
          <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">
            Recommended next step: ${escapeHtml(score.recommendedPackage)}
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">
      Questions? Reply to this email or contact us at
      <a href="mailto:hello@clinovyr.com" style="color:#1a6b5a;">hello@clinovyr.com</a>.
    </p>`;

  return emailShell("Your AI Readiness Report is on the way", body);
}

export async function sendAssessmentEmails(params: {
  formData: AssessmentFormData;
  score: AIReadinessScore;
  assessmentId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  logResendApiKeyLoaded();

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL ?? "hello@clinovyr.com";

  if (!resendApiKey) {
    return { ok: false, error: "Email service is not configured." };
  }

  const resend = new Resend(resendApiKey);
  const from = getFromAddress();
  const siteUrl = getSiteUrl();
  const reportUrl = `${siteUrl}/api/generate-report`;

  const [internalResult, confirmationResult] = await Promise.all([
    resend.emails.send({
      from,
      to: contactEmail,
      replyTo: params.formData.email,
      subject: `AI Readiness Assessment — ${params.formData.companyName}`,
      html: buildInternalAssessmentEmailHtml({
        formData: params.formData,
        score: params.score,
        assessmentId: params.assessmentId,
        reportUrl,
      }),
    }),
    resend.emails.send({
      from,
      to: params.formData.email,
      subject: "Your AI Readiness Report is being prepared — Clinovyr",
      html: buildClientConfirmationEmailHtml({
        formData: params.formData,
        score: params.score,
      }),
    }),
  ]);

  console.log("[assessment-email] Resend internal response:", {
    data: internalResult.data,
    error: internalResult.error,
    errorName: internalResult.error?.name,
    errorMessage: internalResult.error?.message,
    statusCode: internalResult.error?.statusCode,
  });

  console.log("[assessment-email] Resend confirmation response:", {
    data: confirmationResult.data,
    error: confirmationResult.error,
    errorName: confirmationResult.error?.name,
    errorMessage: confirmationResult.error?.message,
    statusCode: confirmationResult.error?.statusCode,
  });

  if (internalResult.error || confirmationResult.error) {
    return { ok: false, error: "Failed to send notification emails." };
  }

  return { ok: true };
}
