import type { Company, Survey } from "@prisma/client";
import { createZipBuffer } from "@/lib/deliverables/generators/shared";
import { companySlug } from "@/lib/deliverables/generators/industries/medical-shared";

function substituteCompany(
  blueprint: Record<string, unknown>,
  company: Company,
): Record<string, unknown> {
  const json = JSON.stringify(blueprint);
  const replaced = json
    .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
    .replace(/\{\{PRACTICE_SLUG\}\}/g, companySlug(company.name));
  return JSON.parse(replaced) as Record<string, unknown>;
}

export function buildAppointmentReminderMedicalBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Medical Appointment Reminders",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "appointment-booked", maxResults: 1 },
          mapper: {},
          metadata: { designer: { x: 0, y: 0 }, note: "EHR/PMS fires when appointment booked" },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            patientName: "{{1.body.patientName}}",
            patientPhone: "{{1.body.patientPhone}}",
            appointmentAt: "{{1.body.appointmentDateTime}}",
            appointmentId: "{{1.body.appointmentId}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: "{{subtract(appointmentAt; 259200)}}" },
          mapper: {},
          metadata: { designer: { x: 560, y: -80 }, note: "Wait until 72h before appointment" },
        },
        {
          id: 4,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{2.patientPhone}}",
            body: "{{COMPANY_NAME}}: Reminder — your appointment is in 3 days on {{formatDate(2.appointmentAt; 'MMM D')}}. Reply CONFIRM or call us to reschedule.",
          },
          metadata: { designer: { x: 840, y: -80 } },
        },
        {
          id: 5,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: "{{subtract(appointmentAt; 86400)}}" },
          mapper: {},
          metadata: { designer: { x: 1120, y: 0 }, note: "24h before appointment" },
        },
        {
          id: 6,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{2.patientPhone}}",
            body: "{{COMPANY_NAME}}: Tomorrow at {{formatDate(2.appointmentAt; 'h:mm A')}}. Please arrive 10 min early. Reply C to confirm.",
          },
          metadata: { designer: { x: 1400, y: 0 } },
        },
        {
          id: 7,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: "{{subtract(appointmentAt; 7200)}}" },
          mapper: {},
          metadata: { designer: { x: 1680, y: 80 }, note: "2h before appointment" },
        },
        {
          id: 8,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: {
            accountSid: "{{API_KEY_TWILIO}}",
            from: "{{TWILIO_FROM_NUMBER}}",
          },
          mapper: {
            to: "{{2.patientPhone}}",
            body: "{{COMPANY_NAME}}: Your appointment is today at {{formatDate(2.appointmentAt; 'h:mm A')}}. See you soon!",
          },
          metadata: { designer: { x: 1960, y: 80 } },
        },
        {
          id: 9,
          module: "google-sheets:addRow",
          version: 2,
          parameters: {
            spreadsheet: "{{GOOGLE_SHEET_ID}}",
            sheet: "Reminder Log",
          },
          mapper: {
            values: [
              "{{now}}",
              "{{2.appointmentId}}",
              "{{2.patientName}}",
              "{{2.patientPhone}}",
              "72h+24h+2h sent",
            ],
          },
          metadata: { designer: { x: 2240, y: 0 } },
        },
      ],
      metadata: {
        templateId: "appointment-reminder-medical",
        industry: "Medical/Dental",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{API_KEY_TWILIO}}",
          "{{TWILIO_FROM_NUMBER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildPatientFollowupMedicalBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Post-Visit Patient Follow-Up",
      flow: [
        {
          id: 1,
          module: "builtin:BasicScheduler",
          version: 1,
          parameters: { cron: "0 18 * * *", timezone: "America/Los_Angeles" },
          mapper: {},
          metadata: { designer: { x: 0, y: -120 }, note: "Daily 6pm PT" },
        },
        {
          id: 2,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "visit-completed" },
          mapper: {},
          metadata: { designer: { x: 0, y: 120 }, note: "EHR visit-completed webhook" },
        },
        {
          id: 3,
          module: "http:ActionSendData",
          version: 3,
          parameters: { url: "{{EHR_API_URL}}/visits/today", method: "GET" },
          mapper: { authorization: "Bearer {{EHR_API_KEY}}" },
          metadata: { designer: { x: 300, y: -120 } },
        },
        {
          id: 4,
          module: "builtin:BasicAggregator",
          version: 1,
          parameters: {},
          mapper: { patients: "{{merge(3.data; 2.body.patients)}}" },
          metadata: { designer: { x: 600, y: 0 } },
        },
        {
          id: 5,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system:
              "Personalize post-visit follow-up for a medical practice. No PHI in output beyond first name. HIPAA-safe tone.",
            prompt:
              "Patient: {{item.firstName}}, visit type: {{item.visitType}}, provider: {{item.provider}}. Write a 2-sentence SMS follow-up and subject line for email.",
          },
          metadata: { designer: { x: 900, y: 0 } },
        },
        {
          id: 6,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: { accountSid: "{{API_KEY_TWILIO}}", from: "{{TWILIO_FROM_NUMBER}}" },
          mapper: {
            to: "{{item.phone}}",
            body: "{{5.content[0].text}}",
          },
          metadata: { designer: { x: 1200, y: -60 } },
        },
        {
          id: 7,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{item.email}}",
            subject: "{{5.subject}}",
            body: "{{5.content[0].text}}",
          },
          mapper: {},
          metadata: { designer: { x: 1200, y: 60 } },
        },
        {
          id: 8,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 172800 },
          mapper: {},
          metadata: { designer: { x: 1500, y: 0 }, note: "48h no-response window" },
        },
        {
          id: 9,
          module: "http:ActionSendData",
          version: 3,
          parameters: { url: "{{CRM_WEBHOOK}}/engagement-check", method: "POST" },
          mapper: { patientId: "{{item.id}}", channel: "second-touch" },
          metadata: { designer: { x: 1800, y: 0 } },
        },
        {
          id: 10,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Follow-Up Log" },
          mapper: {
            values: ["{{now}}", "{{item.id}}", "{{item.firstName}}", "sent", "{{6.status}}"],
          },
          metadata: { designer: { x: 2100, y: 0 } },
        },
      ],
      metadata: {
        templateId: "patient-followup-medical",
        industry: "Medical/Dental",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{EHR_API_URL}}",
          "{{EHR_API_KEY}}",
          "{{API_KEY_TWILIO}}",
          "{{EMAIL_PROVIDER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildReviewGenerationMedicalBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Review Generation (Medical)",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "ehr-appointment-complete" },
          mapper: {},
          metadata: { designer: { x: 0, y: 0 }, note: "EHR marks appointment complete" },
        },
        {
          id: 2,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 86400 },
          mapper: {},
          metadata: { designer: { x: 280, y: 0 }, note: "Wait 24h post-visit" },
        },
        {
          id: 3,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 300 },
          mapper: {
            system:
              "Write a HIPAA-safe, friendly review request SMS. No clinical details. Mention Google Reviews only.",
            prompt:
              "Patient first name: {{1.body.patientFirstName}}. Provider: {{1.body.providerName}}. Practice: {{COMPANY_NAME}}.",
          },
          metadata: { designer: { x: 560, y: 0 } },
        },
        {
          id: 4,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: { accountSid: "{{API_KEY_TWILIO}}", from: "{{TWILIO_FROM_NUMBER}}" },
          mapper: {
            to: "{{1.body.patientPhone}}",
            body: "{{3.content[0].text}} Link: {{GOOGLE_REVIEW_URL}}",
          },
          metadata: { designer: { x: 840, y: 0 } },
        },
        {
          id: 5,
          module: "http:ActionSendData",
          version: 3,
          parameters: { url: "{{TRACKING_WEBHOOK}}", method: "POST" },
          mapper: {
            event: "review_sms_sent",
            appointmentId: "{{1.body.appointmentId}}",
            reviewUrl: "{{GOOGLE_REVIEW_URL}}",
          },
          metadata: { designer: { x: 1120, y: -60 } },
        },
        {
          id: 6,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 172800 },
          mapper: {},
          metadata: { designer: { x: 1400, y: 60 }, note: "48h if not opened" },
        },
        {
          id: 7,
          module: "builtin:BasicRouter",
          version: 1,
          parameters: {},
          mapper: {
            condition: "{{if(5.body.opened; false; true)}}",
          },
          metadata: { designer: { x: 1680, y: 60 } },
        },
        {
          id: 8,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{1.body.patientEmail}}",
            subject: "How was your visit at {{COMPANY_NAME}}?",
            body: "We'd appreciate your feedback on Google: {{GOOGLE_REVIEW_URL}}",
          },
          mapper: {},
          metadata: { designer: { x: 1960, y: 60 } },
        },
        {
          id: 9,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Review Requests" },
          mapper: {
            values: [
              "{{now}}",
              "{{1.body.appointmentId}}",
              "{{1.body.patientFirstName}}",
              "sms+email",
              "{{GOOGLE_REVIEW_URL}}",
            ],
          },
          metadata: { designer: { x: 2240, y: 0 } },
        },
      ],
      metadata: {
        templateId: "review-generation-medical",
        industry: "Medical/Dental",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{API_KEY_TWILIO}}",
          "{{GOOGLE_REVIEW_URL}}",
          "{{TRACKING_WEBHOOK}}",
          "{{EMAIL_PROVIDER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

function buildReadme(company: Company): string {
  return `# ${company.name} — Medical Automation Blueprints

Generated by Clinovyr for Make.com import.

## Files

1. **appointment-reminder-medical.blueprint.json** — Webhook (appointment booked) → patient extract → 72h / 24h / 2h Twilio SMS → Google Sheets log
2. **patient-followup-medical.blueprint.json** — Daily 6pm schedule + visit-completed webhook → Claude personalization → SMS/email → 48h second touch → Sheets
3. **review-generation-medical.blueprint.json** — EHR complete webhook → 24h wait → Claude review request → SMS → tracking → 48h email follow-up → Sheets

## Import into Make.com

1. Log in at [make.com](https://www.make.com) → **Scenarios** → **Create a new scenario**
2. Click the **⋯** menu → **Import Blueprint** (or paste JSON via blueprint import)
3. Select the matching \`.blueprint.json\` file
4. Replace placeholders: Twilio SID/token, Google Sheet ID, EHR webhook URLs, \`{{EMAIL_PROVIDER}}\` connection
5. Run **Test once** with sample webhook payload before enabling scheduling

## HIPAA reminder

- Use vendors that sign a **Business Associate Agreement (BAA)** before sending PHI
- Limit SMS content to non-clinical reminders; route clinical questions to staff
- Consult your compliance officer before go-live

## Support

Clinovyr · clinovyr.com · clinovyr@gmail.com
`;
}

export async function createMedicalBlueprintZip(
  company: Company,
  _survey: Survey,
): Promise<Buffer> {
  const files: Array<{ name: string; content: string }> = [
    {
      name: "appointment-reminder-medical.blueprint.json",
      content: JSON.stringify(
        buildAppointmentReminderMedicalBlueprint(company),
        null,
        2,
      ),
    },
    {
      name: "patient-followup-medical.blueprint.json",
      content: JSON.stringify(buildPatientFollowupMedicalBlueprint(company), null, 2),
    },
    {
      name: "review-generation-medical.blueprint.json",
      content: JSON.stringify(buildReviewGenerationMedicalBlueprint(company), null, 2),
    },
    { name: "README.md", content: buildReadme(company) },
  ];

  return createZipBuffer(files);
}
