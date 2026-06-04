import type { Company, Survey } from "@prisma/client";
import { createZipBuffer } from "@/lib/deliverables/generators/shared";
import { companySlug } from "@/lib/deliverables/generators/industries/wellness-shared";

function substituteCompany(
  blueprint: Record<string, unknown>,
  company: Company,
): Record<string, unknown> {
  const json = JSON.stringify(blueprint);
  const replaced = json
    .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
    .replace(/\{\{SPA_SLUG\}\}/g, companySlug(company.name));
  return JSON.parse(replaced) as Record<string, unknown>;
}

export function buildPostTreatmentRebookingBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Post-Treatment Rebooking (Mindbody/Jane → Claude → SMS → Email)",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "appointment-completed", maxResults: 1 },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            note: "Mindbody or Jane App fires when appointment marked completed",
          },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            clientName: "{{1.body.clientName}}",
            clientPhone: "{{1.body.clientPhone}}",
            clientEmail: "{{1.body.clientEmail}}",
            serviceName: "{{1.body.serviceName}}",
            appointmentDate: "{{1.body.appointmentDate}}",
            providerName: "{{1.body.providerName}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 259200 },
          mapper: {},
          metadata: { designer: { x: 560, y: 0 }, note: "3-day wait post-treatment" },
        },
        {
          id: 4,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 350 },
          mapper: {
            system:
              "Write a warm, personalized rebooking SMS for a med spa client. Reference their treatment by name. Under 160 characters. Include booking link placeholder [BOOKING_LINK]. No medical claims or guaranteed results. Aspirational wellness tone.",
            messages: [
              {
                role: "user",
                content:
                  "Client: {{2.clientName}} | Service: {{2.serviceName}} | Provider: {{2.providerName}} | Date: {{2.appointmentDate}} | {{COMPANY_NAME}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: 0 }, note: "Claude personalized rebooking SMS" },
        },
        {
          id: 5,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{2.clientPhone}}",
            body: "{{4.content[0].text}}",
          },
          metadata: { designer: { x: 1120, y: -80 } },
        },
        {
          id: 6,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 172800 },
          mapper: {},
          metadata: { designer: { x: 1400, y: 0 }, note: "48h after SMS — email follow-up" },
        },
        {
          id: 7,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 500 },
          mapper: {
            system:
              "Write a rebooking email for a wellness client. Warm, aspirational tone. Reference treatment received. Include next-step recommendation (maintenance interval). Under 150 words. CTA to book. FTC-safe — no guaranteed results.",
            messages: [
              {
                role: "user",
                content:
                  "Client: {{2.clientName}} | Service: {{2.serviceName}} | {{COMPANY_NAME}} | Booking: [BOOKING_LINK]",
              },
            ],
          },
          metadata: { designer: { x: 1680, y: 0 } },
        },
        {
          id: 8,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.clientEmail}}",
            subject: "Your {{2.serviceName}} results — let's keep the glow going",
          },
          mapper: { body: "{{7.content[0].text}}" },
          metadata: { designer: { x: 1960, y: 0 } },
        },
        {
          id: 9,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Rebooking Log" },
          mapper: {
            values: [
              "{{now}}",
              "{{2.clientName}}",
              "{{2.serviceName}}",
              "{{2.appointmentDate}}",
              "SMS+email sent",
            ],
          },
          metadata: { designer: { x: 2240, y: 0 } },
        },
      ],
      metadata: {
        templateId: "post-treatment-rebooking",
        industry: "Wellness",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{API_KEY_TWILIO}}",
          "{{TWILIO_FROM_NUMBER}}",
          "{{EMAIL_PROVIDER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildWinBackCampaignBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Win-Back Campaign (45+ Days No Booking → Claude SMS → VIP Discount)",
      flow: [
        {
          id: 1,
          module: "builtin:Schedule",
          version: 1,
          parameters: { interval: 86400 },
          mapper: {},
          metadata: { designer: { x: 0, y: 0 }, note: "Daily schedule — run at 9am local" },
        },
        {
          id: 2,
          module: "http:ActionSendData",
          version: 3,
          parameters: {
            url: "{{BOOKING_API_URL}}/clients?lastVisitBefore=45days",
            method: "GET",
          },
          mapper: {},
          metadata: {
            designer: { x: 280, y: 0 },
            note: "Mindbody Client API or Jane export — clients 45+ days without booking",
          },
        },
        {
          id: 3,
          module: "builtin:Iterator",
          version: 1,
          parameters: {},
          mapper: { array: "{{2.body.clients}}" },
          metadata: { designer: { x: 560, y: 0 } },
        },
        {
          id: 4,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system:
              "Write a win-back SMS for a lapsed med spa client. Warm, not desperate. Mention VIP discount code WINBACK15 (15% off next visit). Reference their last service if provided. Under 160 chars. No health claims.",
            messages: [
              {
                role: "user",
                content:
                  "Client: {{3.name}} | Last service: {{3.lastService}} | Last visit: {{3.lastVisitDate}} | {{COMPANY_NAME}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: 0 } },
        },
        {
          id: 5,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{3.phone}}",
            body: "{{4.content[0].text}}",
          },
          metadata: { designer: { x: 1120, y: 0 } },
        },
        {
          id: 6,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Win-Back Log" },
          mapper: {
            values: [
              "{{now}}",
              "{{3.name}}",
              "{{3.phone}}",
              "{{3.lastVisitDate}}",
              "WINBACK15 sent",
            ],
          },
          metadata: { designer: { x: 1400, y: 0 } },
        },
      ],
      metadata: {
        templateId: "win-back-campaign",
        industry: "Wellness",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{BOOKING_API_URL}}",
          "{{API_KEY_TWILIO}}",
          "{{TWILIO_FROM_NUMBER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildReviewGenerationWellnessBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Review Generation (Completed → 24h → Claude → Google Reviews → Sheets)",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "appointment-completed", maxResults: 1 },
          mapper: {},
          metadata: { designer: { x: 0, y: 0 }, note: "Same webhook as rebooking — can branch in Make" },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            clientName: "{{1.body.clientName}}",
            clientPhone: "{{1.body.clientPhone}}",
            clientEmail: "{{1.body.clientEmail}}",
            serviceName: "{{1.body.serviceName}}",
            providerName: "{{1.body.providerName}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 86400 },
          mapper: {},
          metadata: { designer: { x: 560, y: 0 }, note: "24h after completed visit" },
        },
        {
          id: 4,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system:
              "Write a Google review request SMS. Warm, specific to treatment and provider. Include Google review link placeholder [GOOGLE_REVIEW_LINK]. Under 160 chars. If offering incentive, note FTC disclosure requirement.",
            messages: [
              {
                role: "user",
                content:
                  "Client: {{2.clientName}} | Service: {{2.serviceName}} | Provider: {{2.providerName}} | {{COMPANY_NAME}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: 0 } },
        },
        {
          id: 5,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{2.clientPhone}}",
            body: "{{4.content[0].text}}",
          },
          metadata: { designer: { x: 1120, y: -80 } },
        },
        {
          id: 6,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.clientEmail}}",
            subject: "How was your visit at {{COMPANY_NAME}}?",
          },
          mapper: {
            body: "{{4.content[0].text}}\n\nLeave a review: [GOOGLE_REVIEW_LINK]",
          },
          metadata: { designer: { x: 1120, y: 80 }, note: "Email backup for non-SMS responders" },
        },
        {
          id: 7,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Review Requests" },
          mapper: {
            values: [
              "{{now}}",
              "{{2.clientName}}",
              "{{2.serviceName}}",
              "{{2.providerName}}",
              "request sent",
            ],
          },
          metadata: { designer: { x: 1400, y: 0 } },
        },
      ],
      metadata: {
        templateId: "review-generation-wellness",
        industry: "Wellness",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{API_KEY_TWILIO}}",
          "{{TWILIO_FROM_NUMBER}}",
          "{{EMAIL_PROVIDER}}",
          "{{GOOGLE_SHEET_ID}}",
          "[GOOGLE_REVIEW_LINK]",
        ],
      },
    },
    company,
  );
}

function buildReadme(company: Company): string {
  return `# ${company.name} — Wellness Automation Blueprints

Generated by Clinovyr for Make.com import.

## Files

1. **post-treatment-rebooking.blueprint.json** — Mindbody/Jane webhook on completed appointment → 3-day wait → Claude personalized SMS → 48h email follow-up → Google Sheets log
2. **win-back-campaign.blueprint.json** — Daily schedule → query clients 45+ days without booking → Claude win-back SMS with VIP discount (WINBACK15) → Sheets log
3. **review-generation-wellness.blueprint.json** — Completed appointment → 24h wait → Claude review request → SMS + email with Google Reviews link → Sheets log

## Import into Make.com

1. Log in at [make.com](https://www.make.com) → **Scenarios** → **Create a new scenario**
2. Click the **⋯** menu → **Import Blueprint**
3. Select the matching \`.blueprint.json\` file
4. Replace placeholders: Twilio SID/token, Anthropic API, Mindbody/Jane webhook URL, \`{{BOOKING_API_URL}}\`, Google Sheet ID, \`{{EMAIL_PROVIDER}}\`
5. Run **Test once** with sample webhook payload before enabling scheduling

## Mindbody / Jane setup

- **Mindbody**: Developer portal → Webhooks → \`appointment.completed\`. Requires Accelerate tier for API.
- **Jane App**: Settings → Integrations → Webhooks → appointment completed event.
- Map webhook fields to \`clientName\`, \`clientPhone\`, \`clientEmail\`, \`serviceName\`, \`appointmentDate\`.

## Compliance reminder

- **FTC**: Review all Claude-generated SMS/email for unsubstantiated health or beauty claims before enabling
- **TCPA**: Ensure prior express consent for promotional SMS; separate transactional vs. marketing messages
- **Review incentives**: Disclose any offer tied to reviews (FTC Endorsement Guides)
- Consult your medical director for treatment-specific messaging

## Support

Clinovyr · clinovyr.com · clinovyr@gmail.com · Granite Bay, CA
`;
}

export async function createWellnessBlueprintZip(
  company: Company,
  _survey: Survey,
): Promise<Buffer> {
  const files: Array<{ name: string; content: string }> = [
    {
      name: "post-treatment-rebooking.blueprint.json",
      content: JSON.stringify(buildPostTreatmentRebookingBlueprint(company), null, 2),
    },
    {
      name: "win-back-campaign.blueprint.json",
      content: JSON.stringify(buildWinBackCampaignBlueprint(company), null, 2),
    },
    {
      name: "review-generation-wellness.blueprint.json",
      content: JSON.stringify(buildReviewGenerationWellnessBlueprint(company), null, 2),
    },
    { name: "README.md", content: buildReadme(company) },
  ];

  return createZipBuffer(files);
}
