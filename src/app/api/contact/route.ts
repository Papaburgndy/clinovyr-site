import { Resend } from "resend";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  message?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const RESEND_SANDBOX_FROM = "Clinovyr <onboarding@resend.dev>";

function getFromAddress(): string {
  if (process.env.RESEND_SANDBOX === "true" || !process.env.RESEND_FROM_EMAIL) {
    return RESEND_SANDBOX_FROM;
  }
  return process.env.RESEND_FROM_EMAIL;
}

function buildInternalEmailHtml(data: {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: string;
  message: string;
}): string {
  const rows = [
    ["Full Name", data.fullName],
    ["Business Name", data.businessName],
    ["Email", data.email],
    ["Phone", data.phone || "—"],
    ["Business Type", data.businessType || "—"],
    ["Message", data.message],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #d8d3ca;font-family:'DM Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#7a7468;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #d8d3ca;font-family:system-ui,-apple-system,sans-serif;font-size:15px;color:#0d0f12;line-height:1.5;white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

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
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#0d0f12;">New inquiry received</h1>
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:14px;color:#7a7468;line-height:1.5;">A prospect submitted the contact form on clinovyr.com.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d8d3ca;border-radius:4px;overflow:hidden;">
                ${tableRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 12px;font-family:'DM Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#1a6b5a;">View Full Details</p>
              <p style="margin:0;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.6;">Reply directly to <a href="mailto:${escapeHtml(data.email)}" style="color:#1a6b5a;">${escapeHtml(data.email)}</a> to schedule their free discovery call.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationEmailHtml(data: {
  fullName: string;
  businessName: string;
  contactEmail: string;
}): string {
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
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Hi ${escapeHtml(data.fullName)},</p>
              <p style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:16px;color:#0d0f12;line-height:1.6;">Thanks for reaching out. We received your inquiry for <strong>${escapeHtml(data.businessName)}</strong> and will be in touch within <strong>1 business day</strong>.</p>
              <p style="margin:0 0 24px;font-family:system-ui,sans-serif;font-size:16px;color:#7a7468;line-height:1.6;">In the meantime, you can reply to this email or reach us directly if you have anything to add before your free discovery call.</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:4px;background:#1a6b5a;">
                    <a href="https://clinovyr.com/#contact" style="display:inline-block;padding:12px 24px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;color:#f5f2ed;text-decoration:none;">Visit Clinovyr</a>
                  </td>
                  <td style="width:12px;"></td>
                  <td>
                    <a href="mailto:${escapeHtml(data.contactEmail)}" style="font-family:system-ui,sans-serif;font-size:14px;color:#1a6b5a;text-decoration:none;">${escapeHtml(data.contactEmail)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-family:system-ui,sans-serif;font-size:15px;color:#0d0f12;line-height:1.5;">Warm regards,<br><span style="font-family:Georgia,serif;font-size:18px;color:#1a6b5a;">The Clinovyr Team</span></p>
              <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:13px;color:#7a7468;">Granite Bay, California · AI consulting for local businesses</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.CONTACT_EMAIL;

  if (!resendApiKey || !contactEmail) {
    console.error("Contact API: missing RESEND_API_KEY or CONTACT_EMAIL");
    return Response.json(
      { error: "Email service is not configured." },
      { status: 500 },
    );
  }

  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const businessName = body.businessName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const businessType = body.businessType?.trim() ?? "";

  if (!fullName) {
    return Response.json({ error: "Full name is required." }, { status: 400 });
  }

  if (!businessName) {
    return Response.json(
      { error: "Business name is required." },
      { status: 400 },
    );
  }

  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const resend = new Resend(resendApiKey);
  const from = getFromAddress();

  const submission = {
    fullName,
    businessName,
    email,
    phone,
    businessType,
    message,
  };

  try {
    const [internalResult, confirmationResult] = await Promise.all([
      resend.emails.send({
        from,
        to: contactEmail,
        replyTo: email,
        subject: `New Clinovyr Inquiry — ${businessName}`,
        html: buildInternalEmailHtml(submission),
      }),
      resend.emails.send({
        from,
        to: email,
        subject: "We received your inquiry — Clinovyr",
        html: buildConfirmationEmailHtml({ fullName, businessName, contactEmail }),
      }),
    ]);

    if (internalResult.error || confirmationResult.error) {
      console.error("Contact API: Resend error", {
        internal: internalResult.error,
        confirmation: confirmationResult.error,
      });
      return Response.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Contact API: unexpected error", error);
    return Response.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 },
    );
  }
}
