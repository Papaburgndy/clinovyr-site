import type { Survey } from "@prisma/client";
import { getContactEmail } from "@/lib/assessment-email";
import { parseTopOpportunities } from "@/lib/dashboard-state";
import { DELIVERABLE_KEY_META } from "@/lib/deliverables/artifacts";
import { getDeliverableDescription } from "@/lib/deliverables/descriptions";
import type { DeliverableRecord } from "@/lib/deliverables/types";
import { escapeHtml, getAppBaseUrl, sendAuthEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function topOpportunityHeadline(
  biggestOpportunity: string | null | undefined,
  topOpportunities: Survey["topOpportunities"],
): string | null {
  if (biggestOpportunity?.trim()) return biggestOpportunity.trim();
  const items = parseTopOpportunities(topOpportunities);
  const first = items[0];
  if (!first) return null;
  return (first.title ?? first.name)?.trim() ?? null;
}

function deliveryEmailHtml(params: {
  recipientName: string;
  product: string;
  companyName: string;
  deliverables: DeliverableRecord[];
  portalUrl: string;
  calendlyUrl: string;
  topOpportunity: string | null;
}): string {
  const {
    recipientName,
    product,
    companyName,
    deliverables,
    portalUrl,
    calendlyUrl,
    topOpportunity,
  } = params;

  const deliverableRows = deliverables
    .map((item, index) => {
      const label =
        DELIVERABLE_KEY_META[item.key]?.displayName ?? item.name;
      const description = getDeliverableDescription(item.key);
      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #d8d3ca;vertical-align:top;width:32px;font-family:monospace;font-size:14px;color:#1a6b5a;">${index + 1}.</td>
          <td style="padding:16px 0;border-bottom:1px solid #d8d3ca;">
            <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#0d0f12;">${escapeHtml(label)}</p>
            <p style="margin:0 0 10px;font-size:13px;color:#7a7468;line-height:1.5;">${escapeHtml(description)}</p>
            <a href="${escapeHtml(item.url)}" style="font-size:13px;color:#1a6b5a;font-weight:600;text-decoration:none;">Download file →</a>
          </td>
        </tr>`;
    })
    .join("");

  const nextStepsBlock = topOpportunity
    ? `<p style="margin:0 0 12px;font-size:14px;color:#0d0f12;line-height:1.6;"><strong>Recommended next step:</strong> ${escapeHtml(topOpportunity)}</p>
       <p style="margin:0 0 20px;font-size:14px;color:#7a7468;line-height:1.5;">Book a strategy call to walk through your deliverables and plan implementation with our team.</p>`
    : `<p style="margin:0 0 20px;font-size:14px;color:#7a7468;line-height:1.5;">Book a strategy call to walk through your deliverables and plan implementation with our team.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;">
  <table role="presentation" width="100%" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:4px;border:1px solid #d8d3ca;">
        <tr>
          <td style="background:#0d0f12;padding:28px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#f5f2ed;">Clinovyr</p>
            <p style="margin:8px 0 0;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Deliverables ready</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(recipientName)},</p>
            <p style="margin:0 0 20px;font-size:16px;color:#0d0f12;line-height:1.6;">Your <strong>${escapeHtml(product)}</strong> deliverables for <strong>${escapeHtml(companyName)}</strong> are ready — ${deliverables.length} personalized file${deliverables.length === 1 ? "" : "s"} await you in the portal.</p>
            <table role="presentation" width="100%" style="margin:0 0 24px;">${deliverableRows}</table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
              <tr>
                <td style="border-radius:4px;background:#1a6b5a;">
                  <a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:12px 28px;color:#f5f2ed;text-decoration:none;font-size:14px;font-weight:600;">Open deliverables portal</a>
                </td>
              </tr>
            </table>
            ${nextStepsBlock}
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
              <tr>
                <td style="border-radius:4px;border:1px solid #1a6b5a;">
                  <a href="${escapeHtml(calendlyUrl)}" style="display:inline-block;padding:10px 24px;color:#1a6b5a;text-decoration:none;font-size:14px;font-weight:600;">Schedule a strategy call</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#7a7468;line-height:1.5;">Questions? Reply to this email or contact us at ${escapeHtml(getContactEmail())}.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendDeliveryEmail(params: {
  companyId: string;
  product: string;
  deliverables: DeliverableRecord[];
}): Promise<void> {
  const { companyId, product, deliverables } = params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: true, survey: true },
  });

  if (!company?.user.email) {
    console.error("[delivery-email] missing company or user email:", companyId);
    return;
  }

  const baseUrl = getAppBaseUrl();
  const portalUrl = `${baseUrl}/dashboard/deliverables`;
  const calendlyUrl =
    process.env.CALENDLY_URL ?? "https://calendly.com/clinovyr";
  const recipientName = company.user.name?.trim() || "there";
  const topOpportunity = topOpportunityHeadline(
    company.survey?.biggestOpportunity,
    company.survey?.topOpportunities ?? null,
  );

  const html = deliveryEmailHtml({
    recipientName,
    product,
    companyName: company.name,
    deliverables,
    portalUrl,
    calendlyUrl,
    topOpportunity,
  });

  const subject = `Your ${product} deliverables are ready, ${recipientName}!`;

  const result = await sendAuthEmail({
    to: company.user.email,
    bcc: getContactEmail(),
    subject,
    html,
  });

  if (!result.ok) {
    console.error("[delivery-email] client delivery email failed");
  }
}
