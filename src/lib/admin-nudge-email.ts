import {
  escapeHtml,
  getAppBaseUrl,
  sendAuthEmail,
} from "@/lib/email";
import { getPipelineStage, type CompanyWithRelations } from "@/lib/admin-data";

export async function sendAdminNudgeEmail(
  company: CompanyWithRelations,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stage = getPipelineStage(company);
  const baseUrl = getAppBaseUrl();
  const name = company.user.name ?? company.user.email.split("@")[0];
  const dashboardUrl = `${baseUrl}/dashboard`;

  let subject: string;
  let body: string;

  switch (stage) {
    case "survey-incomplete":
      subject = `Complete your AI Readiness Assessment — ${company.name}`;
      body = `<p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">You started onboarding with Clinovyr — your AI Readiness Assessment is still waiting. It takes about 15 minutes and unlocks your personalized score and recommendations.</p>
        <p style="margin:0 0 24px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;"><a href="${escapeHtml(`${baseUrl}/dashboard/assessment`)}" style="color:#1a6b5a;font-weight:600;">Continue your assessment →</a></p>`;
      break;
    case "survey-complete-no-order":
      subject = `Your AI readiness results are ready — ${company.name}`;
      body = `<p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Your assessment is complete. Review your executive summary and choose the Clinovyr package that fits your roadmap.</p>
        <p style="margin:0 0 24px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;"><a href="${escapeHtml(`${baseUrl}/dashboard/results`)}" style="color:#1a6b5a;font-weight:600;">View results &amp; purchase →</a></p>`;
      break;
    default:
      subject = `Your Clinovyr deliverables — ${company.name}`;
      body = `<p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Your order is in progress. Check your portal for deliverables and next steps.</p>
        <p style="margin:0 0 24px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;"><a href="${escapeHtml(dashboardUrl)}" style="color:#1a6b5a;font-weight:600;">Open your dashboard →</a></p>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 16px;background:#f5f2ed;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d8d3ca;border-radius:4px;">
    <tr><td style="background:#0d0f12;padding:24px 28px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:24px;color:#f5f2ed;">Clinovyr</p>
    </td></tr>
    <tr><td style="padding:28px;">${body}</td></tr>
  </table>
</body>
</html>`;

  return sendAuthEmail({
    to: company.user.email,
    subject,
    html,
  });
}
