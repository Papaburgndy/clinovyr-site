import {
  escapeHtml,
  getAppBaseUrl,
  sendAuthEmail,
} from "@/lib/email";
import { getContactEmail } from "@/lib/assessment-email";
import { formatCents } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

function paymentConfirmationHtml(params: {
  companyName: string;
  product: string;
  amountFormatted: string;
  dashboardUrl: string;
}): string {
  const { companyName, product, amountFormatted, dashboardUrl } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;">
  <table role="presentation" width="100%" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:4px;border:1px solid #d8d3ca;">
        <tr>
          <td style="background:#0d0f12;padding:28px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#f5f2ed;">Clinovyr</p>
            <p style="margin:8px 0 0;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Payment confirmed</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0d0f12;line-height:1.6;">Thank you — your payment for <strong>${escapeHtml(companyName)}</strong> is confirmed.</p>
            <table role="presentation" width="100%" style="margin:0 0 24px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #d8d3ca;font-family:monospace;font-size:11px;color:#7a7468;">Package</td>
                <td style="padding:8px 0;border-bottom:1px solid #d8d3ca;font-size:15px;color:#0d0f12;">${escapeHtml(product)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-family:monospace;font-size:11px;color:#7a7468;">Amount</td>
                <td style="padding:8px 0;font-size:15px;color:#0d0f12;">${escapeHtml(amountFormatted)}</td>
              </tr>
            </table>
            <p style="margin:0 0 20px;font-size:14px;color:#7a7468;line-height:1.5;">We're preparing your deliverables. You'll receive another email when they're ready in your portal (usually within a few minutes).</p>
            <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 28px;background:#1a6b5a;color:#f5f2ed;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;">Open dashboard</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function deliverablesReadyHtml(params: {
  companyName: string;
  product: string;
  deliverablesUrl: string;
  count: number;
}): string {
  const { companyName, product, deliverablesUrl, count } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f2ed;">
  <table role="presentation" width="100%" style="background:#f5f2ed;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:4px;border:1px solid #d8d3ca;">
        <tr>
          <td style="background:#0d0f12;padding:28px 32px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:26px;color:#f5f2ed;">Clinovyr</p>
            <p style="margin:8px 0 0;font-size:12px;color:#2d9e88;letter-spacing:0.12em;text-transform:uppercase;">Deliverables ready</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#0d0f12;line-height:1.6;">Your <strong>${escapeHtml(product)}</strong> deliverables for <strong>${escapeHtml(companyName)}</strong> are ready.</p>
            <p style="margin:0 0 20px;font-size:14px;color:#7a7468;">${count} file${count === 1 ? "" : "s"} are available in your portal.</p>
            <a href="${escapeHtml(deliverablesUrl)}" style="display:inline-block;padding:12px 28px;background:#1a6b5a;color:#f5f2ed;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;">View deliverables</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPaymentConfirmationEmail(
  companyId: string,
  product: string,
  amountCents: number,
): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: true },
  });

  if (!company) {
    console.error("[deliverables/email] company not found:", companyId);
    return;
  }

  const amountFormatted = formatCents(amountCents);
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;
  const html = paymentConfirmationHtml({
    companyName: company.name,
    product,
    amountFormatted,
    dashboardUrl,
  });

  const userEmail = company.user.email;
  if (userEmail) {
    const result = await sendAuthEmail({
      to: userEmail,
      subject: `Payment confirmed — ${product}`,
      html,
    });
    if (!result.ok) {
      console.error("[deliverables/email] user payment email failed");
    }
  }

  const internalHtml = paymentConfirmationHtml({
    companyName: company.name,
    product,
    amountFormatted,
    dashboardUrl,
  });

  await sendAuthEmail({
    to: getContactEmail(),
    subject: `[Clinovyr] Payment — ${company.name} (${product})`,
    html: internalHtml.replace(
      "Payment confirmed",
      "New client payment",
    ),
  });
}

/** @deprecated Use sendDeliveryEmail from @/lib/emails/delivery-email */
export async function sendDeliverablesReadyEmail(
  companyId: string,
  product: string,
  deliverableCount: number,
): Promise<void> {
  const { sendDeliveryEmail } = await import("@/lib/emails/delivery-email");
  const { parseDeliverableRecords } = await import(
    "@/lib/deliverables/parse-records"
  );

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { order: true, user: true },
  });

  const deliverables = parseDeliverableRecords(company?.order?.deliverables);
  if (deliverables.length > 0) {
    await sendDeliveryEmail({ companyId, product, deliverables });
    return;
  }

  const deliverablesUrl = `${getAppBaseUrl()}/dashboard/deliverables`;
  const html = deliverablesReadyHtml({
    companyName: company?.name ?? "Client",
    product,
    deliverablesUrl,
    count: deliverableCount,
  });

  if (company?.user.email) {
    await sendAuthEmail({
      to: company.user.email,
      bcc: getContactEmail(),
      subject: `Your Clinovyr deliverables are ready — ${company.name}`,
      html,
    });
  }
}
