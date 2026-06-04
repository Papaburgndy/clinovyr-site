import {
  escapeHtml,
  getAppBaseUrl,
  getFromAddress,
  sendAuthEmail,
} from "@/lib/email";
import type { AIReadinessScore } from "@/lib/scoring";
import type { AssessmentFormData } from "@/types/assessment";

const CONTACT_EMAIL_FALLBACK = "clinovyr@gmail.com";

export function buildPortalAssessmentNotificationHtml(params: {
  formData: AssessmentFormData;
  score: AIReadinessScore;
  userName: string | null;
  userEmail: string;
  companyPhone: string | null;
}): string {
  const { formData, score, userName, userEmail, companyPhone } = params;

  const rows = [
    ["Company", formData.companyName],
    ["Industry", formData.industry],
    ["Contact", userName ?? userEmail],
    ["Email", userEmail],
    ["Phone", companyPhone ?? "—"],
    ["Overall Score", `${score.overallScore}/100`],
    ["Tier", score.tier],
    ["Recommended Package", score.recommendedPackage],
    ["Est. Annual ROI", score.estimatedAnnualROI],
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

  const opportunities = score.topOpportunities
    .map(
      (opp) =>
        `<li style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.5;">${escapeHtml(opp)}</li>`,
    )
    .join("");

  const notes = formData.additionalNotes.trim()
    ? `<p style="margin:16px 0 0;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.5;"><strong>Additional notes:</strong> ${escapeHtml(formData.additionalNotes)}</p>`
    : "";

  const dashboardUrl = `${getAppBaseUrl()}/dashboard/results`;

  return `
    <p style="margin:0 0 20px;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">A portal user completed their AI Readiness Assessment.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tableRows}</table>
    <p style="margin:20px 0 8px;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7468;">Top opportunities</p>
    <ul style="margin:0;padding-left:20px;">${opportunities}</ul>
    ${notes}
    <p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.5;">
      <a href="${escapeHtml(dashboardUrl)}" style="color:#1a6b5a;">View in portal dashboard</a>
    </p>`;
}

export async function sendPortalAssessmentNotification(params: {
  formData: AssessmentFormData;
  score: AIReadinessScore;
  userName: string | null;
  userEmail: string;
  companyPhone: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const contactEmail =
    process.env.CONTACT_EMAIL ?? CONTACT_EMAIL_FALLBACK;

  const html = `<!DOCTYPE html>
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
              <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Portal Assessment Complete</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#0d0f12;">New AI Readiness Assessment</h1>
              ${buildPortalAssessmentNotificationHtml(params)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendAuthEmail({
    to: contactEmail,
    subject: `Portal Assessment — ${params.formData.companyName} (${params.score.overallScore}/100)`,
    html,
  });
}

export function getContactEmail(): string {
  return process.env.CONTACT_EMAIL ?? CONTACT_EMAIL_FALLBACK;
}

export { getFromAddress };
