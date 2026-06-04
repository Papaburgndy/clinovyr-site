import type { Company, Survey } from "@prisma/client";
import { createZipBuffer } from "@/lib/deliverables/generators/shared";
import { companySlug } from "@/lib/deliverables/generators/industries/construction-shared";

function substituteClient(
  workflow: Record<string, unknown>,
  company: Company,
): Record<string, unknown> {
  const json = JSON.stringify(workflow);
  const slug = companySlug(company.name);
  const replaced = json
    .replace(/\{\{CLIENT_NAME\}\}/g, company.name)
    .replace(/\{\{CLIENT_SLUG\}\}/g, slug);
  return JSON.parse(replaced) as Record<string, unknown>;
}

export function buildClientProgressReportWorkflow(
  company: Company,
): Record<string, unknown> {
  return substituteClient(
    {
      name: "{{CLIENT_NAME}} - Client Progress Report (Construction)",
      nodes: [
        {
          parameters: {
            rule: {
              interval: [
                {
                  field: "cronExpression",
                  expression: "0 14 * * 5",
                },
              ],
            },
          },
          id: "c1a2b3c4-5001-4a5b-9c0d-111111111101",
          name: "Friday 2pm Schedule",
          type: "n8n-nodes-base.scheduleTrigger",
          typeVersion: 1.2,
          position: [0, 320],
        },
        {
          parameters: {
            operation: "search",
            base: {
              __rl: true,
              value: "={{ '{{CLIENT_AIRTABLE_BASE_ID}}' }}",
              mode: "id",
            },
            table: {
              __rl: true,
              value: "Active Jobs",
              mode: "name",
            },
            filterByFormula: "{Status} = 'Active'",
            options: {},
          },
          id: "c1a2b3c4-5002-4a5b-9c0d-111111111102",
          name: "Pull Active Jobs Airtable",
          type: "n8n-nodes-base.airtable",
          typeVersion: 2.1,
          position: [280, 220],
          credentials: {
            airtableTokenApi: {
              id: "{{CLIENT_AIRTABLE_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Airtable",
            },
          },
        },
        {
          parameters: {
            operation: "read",
            documentId: {
              __rl: true,
              value: "={{ '{{CLIENT_SHEETS_JOBS_ID}}' }}",
              mode: "id",
            },
            sheetName: {
              __rl: true,
              value: "Active Jobs",
              mode: "name",
            },
            options: {},
          },
          id: "c1a2b3c4-5003-4a5b-9c0d-111111111103",
          name: "Pull Active Jobs Sheets",
          type: "n8n-nodes-base.googleSheets",
          typeVersion: 4.5,
          position: [280, 420],
          credentials: {
            googleSheetsOAuth2Api: {
              id: "{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Google Sheets",
            },
          },
        },
        {
          parameters: {
            jsCode:
              "const airtable = $('Pull Active Jobs Airtable').all().map(i => i.json);\nconst sheets = $('Pull Active Jobs Sheets').all().map(i => i.json);\nconst jobs = [...airtable, ...sheets].filter(j => j && (j.client_email || j.clientEmail));\nif (!jobs.length) {\n  return [{ json: { skip: true, reason: 'No active jobs found' } }];\n}\nreturn jobs.map(j => ({\n  json: {\n    jobId: j.id ?? j.job_id ?? j.JobID,\n    clientName: j.client_name ?? j.clientName ?? j.Client,\n    clientEmail: j.client_email ?? j.clientEmail ?? j.Email,\n    address: j.address ?? j.Address ?? j.project_address,\n    completedThisWeek: j.completed_this_week ?? j.completedThisWeek ?? j.notes ?? '',\n    nextWeekPlan: j.next_week ?? j.nextWeekPlan ?? '',\n    openItems: j.open_items ?? j.openItems ?? j.permit_status ?? ''\n  }\n}));",
          },
          id: "c1a2b3c4-5004-4a5b-9c0d-111111111104",
          name: "Normalize Job Records",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [560, 320],
        },
        {
          parameters: {
            method: "POST",
            url: "https://api.anthropic.com/v1/messages",
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: "anthropic-version", value: "2023-06-01" },
                { name: "content-type", value: "application/json" },
              ],
            },
            sendBody: true,
            specifyBody: "json",
            jsonBody:
              '={\n  "model": "{{CLIENT_ANTHROPIC_MODEL}}",\n  "max_tokens": 800,\n  "messages": [\n    {\n      "role": "user",\n      "content": "Write a friendly Friday progress update email for a construction client. Plain language, no jargon. Under 250 words. Sign as {{CLIENT_NAME}}. Job data: " + JSON.stringify($json) + ". Include: completed this week, next week plan, open items (permits/selections)."\n    }\n  ]\n}',
            options: {},
          },
          id: "c1a2b3c4-5005-4a5b-9c0d-111111111105",
          name: "Claude Progress Update",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [820, 320],
          credentials: {
            httpHeaderAuth: {
              id: "{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Anthropic API",
            },
          },
        },
        {
          parameters: {
            jsCode:
              "const job = $('Normalize Job Records').item.json;\nconst raw = $input.first().json;\nconst body = raw.content?.[0]?.text ?? 'Progress update unavailable — please call {{CLIENT_NAME}}.';\nreturn [{ json: { ...job, emailBody: body, subject: `Progress update — ${job.address || 'your project'}` } }];",
          },
          id: "c1a2b3c4-5006-4a5b-9c0d-111111111106",
          name: "Format Email",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [1080, 320],
        },
        {
          parameters: {
            fromEmail: "={{ '{{CLIENT_FROM_EMAIL}}' }}",
            toEmail: "={{ $json.clientEmail }}",
            subject: "={{ $json.subject }}",
            emailType: "text",
            message: "={{ $json.emailBody }}",
            options: {},
          },
          id: "c1a2b3c4-5007-4a5b-9c0d-111111111107",
          name: "Email Client Update",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2.1,
          position: [1340, 320],
          credentials: {
            smtp: {
              id: "{{CLIENT_SMTP_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} SMTP",
            },
          },
        },
        {
          parameters: {
            operation: "append",
            documentId: {
              __rl: true,
              value: "={{ '{{CLIENT_SHEETS_LOG_ID}}' }}",
              mode: "id",
            },
            sheetName: {
              __rl: true,
              value: "Progress Report Log",
              mode: "name",
            },
            columns: {
              mappingMode: "defineBelow",
              value: {
                sent_at: "={{ $now.toISO() }}",
                job_id: "={{ $json.jobId }}",
                client: "={{ $json.clientName }}",
                email: "={{ $json.clientEmail }}",
                address: "={{ $json.address }}",
                status: "sent",
              },
            },
            options: {},
          },
          id: "c1a2b3c4-5008-4a5b-9c0d-111111111108",
          name: "Log Report Sent",
          type: "n8n-nodes-base.googleSheets",
          typeVersion: 4.5,
          position: [1600, 320],
          credentials: {
            googleSheetsOAuth2Api: {
              id: "{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Google Sheets",
            },
          },
        },
      ],
      connections: {
        "Friday 2pm Schedule": {
          main: [
            [
              { node: "Pull Active Jobs Airtable", type: "main", index: 0 },
              { node: "Pull Active Jobs Sheets", type: "main", index: 0 },
            ],
          ],
        },
        "Pull Active Jobs Airtable": {
          main: [[{ node: "Normalize Job Records", type: "main", index: 0 }]],
        },
        "Pull Active Jobs Sheets": {
          main: [[{ node: "Normalize Job Records", type: "main", index: 0 }]],
        },
        "Normalize Job Records": {
          main: [[{ node: "Claude Progress Update", type: "main", index: 0 }]],
        },
        "Claude Progress Update": {
          main: [[{ node: "Format Email", type: "main", index: 0 }]],
        },
        "Format Email": {
          main: [[{ node: "Email Client Update", type: "main", index: 0 }]],
        },
        "Email Client Update": {
          main: [[{ node: "Log Report Sent", type: "main", index: 0 }]],
        },
      },
      active: false,
      settings: {
        executionOrder: "v1",
        saveManualExecutions: true,
        timezone: "{{CLIENT_TIMEZONE}}",
      },
      meta: {
        templateCredsSetupCompleted: false,
        instanceId: "{{N8N_INSTANCE_ID}}",
        templateId: "client-progress-report-construction",
      },
      pinData: {},
      tags: [],
    },
    company,
  );
}

export function buildLeadQualificationContractorWorkflow(
  company: Company,
): Record<string, unknown> {
  return substituteClient(
    {
      name: "{{CLIENT_NAME}} - Contractor Lead Qualifier",
      nodes: [
        {
          parameters: {
            httpMethod: "POST",
            path: "{{CLIENT_WEBHOOK_PATH}}/contractor-lead",
            responseMode: "lastNode",
            options: {},
          },
          id: "c2a3b4c5-6001-4a5b-9c0d-222222222201",
          name: "Lead Form Webhook",
          type: "n8n-nodes-base.webhook",
          typeVersion: 2,
          position: [0, 320],
          webhookId: "c2a3b4c5-6001-4a5b-9c0d-222222222201",
        },
        {
          parameters: {
            jsCode:
              "const body = $input.first().json.body ?? $input.first().json;\nconst lead = {\n  id: body.lead_id ?? body.id,\n  name: body.name,\n  email: body.email,\n  phone: body.phone,\n  projectType: body.project_type ?? body.projectType ?? 'remodel',\n  city: body.city ?? body.location,\n  timeline: body.timeline ?? body.start_date,\n  budget: body.budget ?? body.budget_range,\n  message: body.message ?? body.notes ?? '',\n  source: body.source ?? 'website'\n};\nreturn [{ json: lead }];",
          },
          id: "c2a3b4c5-6002-4a5b-9c0d-222222222202",
          name: "Parse Lead",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [260, 320],
        },
        {
          parameters: {
            method: "POST",
            url: "https://api.anthropic.com/v1/messages",
            authentication: "genericCredentialType",
            genericAuthType: "httpHeaderAuth",
            sendHeaders: true,
            headerParameters: {
              parameters: [
                { name: "anthropic-version", value: "2023-06-01" },
                { name: "content-type", value: "application/json" },
              ],
            },
            sendBody: true,
            specifyBody: "json",
            jsonBody:
              '={\n  "model": "{{CLIENT_ANTHROPIC_MODEL}}",\n  "max_tokens": 400,\n  "messages": [\n    {\n      "role": "user",\n      "content": "Score this construction/remodel lead 1-10 for a Placer County GC. Reply JSON only: {\\\"score\\\": number, \\\"reason\\\": string, \\\"autoReply\\\": string (under 120 words, friendly first response) }. Lead: " + JSON.stringify($json)\n    }\n  ]\n}',
            options: {},
          },
          id: "c2a3b4c5-6003-4a5b-9c0d-222222222203",
          name: "Claude Lead Score",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [520, 320],
          credentials: {
            httpHeaderAuth: {
              id: "{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Anthropic API",
            },
          },
        },
        {
          parameters: {
            jsCode:
              "const lead = $('Parse Lead').first().json;\nconst raw = $input.first().json;\nlet score = 5;\nlet reason = 'Default score';\nlet autoReply = 'Thanks for reaching out to {{CLIENT_NAME}}. We will review your project and respond shortly.';\ntry {\n  const text = raw.content?.[0]?.text ?? JSON.stringify(raw);\n  const match = text.match(/\\{[\\s\\S]*\\}/);\n  if (match) {\n    const parsed = JSON.parse(match[0]);\n    score = Number(parsed.score) || score;\n    reason = parsed.reason || reason;\n    autoReply = parsed.autoReply || autoReply;\n  }\n} catch (e) {\n  reason = 'Parse error: ' + e.message;\n}\nreturn [{ json: { ...lead, score, reason, autoReply, tier: score >= 7 ? 'hot' : score >= 4 ? 'warm' : 'cold' } }];",
          },
          id: "c2a3b4c5-6004-4a5b-9c0d-222222222204",
          name: "Normalize Score",
          type: "n8n-nodes-base.code",
          typeVersion: 2,
          position: [780, 320],
        },
        {
          parameters: {
            conditions: {
              options: {
                caseSensitive: true,
                leftValue: "",
                typeValidation: "strict",
              },
              conditions: [
                {
                  id: "hot-lead",
                  leftValue: "={{ $json.score }}",
                  rightValue: 7,
                  operator: { type: "number", operation: "gte" },
                },
              ],
              combinator: "and",
            },
            options: {},
          },
          id: "c2a3b4c5-6005-4a5b-9c0d-222222222205",
          name: "Score >= 7 Hot",
          type: "n8n-nodes-base.if",
          typeVersion: 2,
          position: [1040, 320],
        },
        {
          parameters: {
            resource: "sms",
            operation: "send",
            from: "={{ '{{CLIENT_TWILIO_FROM}}' }}",
            to: "={{ '{{CLIENT_OWNER_PHONE}}' }}",
            message:
              "=HOT LEAD ({{ $json.score }}/10): {{ $json.name }} — {{ $json.phone }} — {{ $json.projectType }} in {{ $json.city }}. {{ $json.reason }}",
          },
          id: "c2a3b4c5-6006-4a5b-9c0d-222222222206",
          name: "SMS Owner Hot Lead",
          type: "n8n-nodes-base.twilio",
          typeVersion: 1,
          position: [1300, 180],
          credentials: {
            twilioApi: {
              id: "{{CLIENT_TWILIO_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Twilio",
            },
          },
        },
        {
          parameters: {
            fromEmail: "={{ '{{CLIENT_FROM_EMAIL}}' }}",
            toEmail: "={{ $json.email }}",
            subject: "Re: Your {{ $json.projectType }} project — {{CLIENT_NAME}}",
            emailType: "text",
            message: "={{ $json.autoReply }}",
            options: {},
          },
          id: "c2a3b4c5-6007-4a5b-9c0d-222222222207",
          name: "Auto-Reply Lead",
          type: "n8n-nodes-base.emailSend",
          typeVersion: 2.1,
          position: [1300, 420],
          credentials: {
            smtp: {
              id: "{{CLIENT_SMTP_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} SMTP",
            },
          },
        },
        {
          parameters: {
            method: "POST",
            url: "={{ '{{CLIENT_CRM_WEBHOOK_URL}}' }}",
            sendBody: true,
            specifyBody: "json",
            jsonBody:
              "={{ JSON.stringify({ name: $json.name, email: $json.email, phone: $json.phone, score: $json.score, tier: $json.tier, projectType: $json.projectType, source: $json.source, notes: $json.reason }) }}",
            options: {},
          },
          id: "c2a3b4c5-6008-4a5b-9c0d-222222222208",
          name: "Push to CRM",
          type: "n8n-nodes-base.httpRequest",
          typeVersion: 4.2,
          position: [1560, 320],
        },
        {
          parameters: {
            operation: "append",
            documentId: {
              __rl: true,
              value: "={{ '{{CLIENT_SHEETS_LEADS_ID}}' }}",
              mode: "id",
            },
            sheetName: {
              __rl: true,
              value: "Lead Qualification",
              mode: "name",
            },
            columns: {
              mappingMode: "defineBelow",
              value: {
                timestamp: "={{ $now.toISO() }}",
                lead_id: "={{ $json.id }}",
                name: "={{ $json.name }}",
                email: "={{ $json.email }}",
                phone: "={{ $json.phone }}",
                score: "={{ $json.score }}",
                tier: "={{ $json.tier }}",
                project_type: "={{ $json.projectType }}",
                source: "={{ $json.source }}",
              },
            },
            options: {},
          },
          id: "c2a3b4c5-6009-4a5b-9c0d-222222222209",
          name: "Log to Google Sheets",
          type: "n8n-nodes-base.googleSheets",
          typeVersion: 4.5,
          position: [1820, 320],
          credentials: {
            googleSheetsOAuth2Api: {
              id: "{{CLIENT_GOOGLE_SHEETS_CREDENTIAL_ID}}",
              name: "{{CLIENT_NAME}} Google Sheets",
            },
          },
        },
      ],
      connections: {
        "Lead Form Webhook": {
          main: [[{ node: "Parse Lead", type: "main", index: 0 }]],
        },
        "Parse Lead": {
          main: [[{ node: "Claude Lead Score", type: "main", index: 0 }]],
        },
        "Claude Lead Score": {
          main: [[{ node: "Normalize Score", type: "main", index: 0 }]],
        },
        "Normalize Score": {
          main: [[{ node: "Score >= 7 Hot", type: "main", index: 0 }]],
        },
        "Score >= 7 Hot": {
          main: [
            [{ node: "SMS Owner Hot Lead", type: "main", index: 0 }],
            [{ node: "Auto-Reply Lead", type: "main", index: 0 }],
          ],
        },
        "SMS Owner Hot Lead": {
          main: [[{ node: "Auto-Reply Lead", type: "main", index: 0 }]],
        },
        "Auto-Reply Lead": {
          main: [[{ node: "Push to CRM", type: "main", index: 0 }]],
        },
        "Push to CRM": {
          main: [[{ node: "Log to Google Sheets", type: "main", index: 0 }]],
        },
      },
      active: false,
      settings: {
        executionOrder: "v1",
        saveManualExecutions: true,
        timezone: "{{CLIENT_TIMEZONE}}",
      },
      meta: {
        templateCredsSetupCompleted: false,
        instanceId: "{{N8N_INSTANCE_ID}}",
        templateId: "lead-qualification-contractor",
      },
      pinData: {},
      tags: [],
    },
    company,
  );
}

function buildReadme(company: Company): string {
  return `# ${company.name} — Construction Automation Blueprints (n8n)

Generated by Clinovyr for n8n import.

## Files

1. **client-progress-report-construction.workflow.json** — Friday 2pm cron → pull active jobs from Airtable + Google Sheets → Claude drafts client progress email → SMTP send → Google Sheets log
2. **lead-qualification-contractor.workflow.json** — Website form webhook → Claude scores lead (1–10) + drafts auto-reply → SMS owner on hot leads (≥7) → email auto-reply → CRM webhook → Sheets log

## Import into n8n

1. Open your n8n instance (Cloud or self-hosted)
2. **Workflows** → **⋯** menu → **Import from File**
3. Select each \`.workflow.json\` file
4. Map credentials on nodes with red warnings:
   - Anthropic API (HTTP Header Auth)
   - Google Sheets OAuth2
   - Airtable (optional — disable node if using Sheets only)
   - SMTP / email send
   - Twilio (lead qualifier)
5. Search for \`{{CLIENT_\` placeholders and replace with client values or n8n environment variables
6. **Test workflow** with sample data before activating

## Placeholders to configure

| Placeholder | Used in |
|-------------|---------|
| \`{{CLIENT_ANTHROPIC_MODEL}}\` | Both workflows |
| \`{{CLIENT_ANTHROPIC_CREDENTIAL_ID}}\` | Both |
| \`{{CLIENT_SHEETS_JOBS_ID}}\` | Progress report |
| \`{{CLIENT_SHEETS_LOG_ID}}\` | Progress report |
| \`{{CLIENT_AIRTABLE_BASE_ID}}\` | Progress report (optional) |
| \`{{CLIENT_FROM_EMAIL}}\` | Both |
| \`{{CLIENT_SMTP_CREDENTIAL_ID}}\` | Both |
| \`{{CLIENT_WEBHOOK_PATH}}\` | Lead qualifier |
| \`{{CLIENT_OWNER_PHONE}}\` | Lead qualifier SMS |
| \`{{CLIENT_TWILIO_*\` | Lead qualifier |
| \`{{CLIENT_CRM_WEBHOOK_URL}}\` | Lead qualifier |
| \`{{CLIENT_TIMEZONE}}\` | Both (e.g. America/Los_Angeles) |

## Job tracker sheet columns (Active Jobs)

For Google Sheets: \`job_id\`, \`client_name\`, \`client_email\`, \`address\`, \`completed_this_week\`, \`next_week\`, \`open_items\`, \`Status\` (= Active)

Update \`completed_this_week\` / \`next_week\` during the week — Claude turns bullets into client-ready prose on Fridays.

## Support

Clinovyr · clinovyr.com · clinovyr@gmail.com · Granite Bay, CA
`;
}

export async function createConstructionBlueprintZip(
  company: Company,
  _survey: Survey,
): Promise<Buffer> {
  const files: Array<{ name: string; content: string }> = [
    {
      name: "client-progress-report-construction.workflow.json",
      content: JSON.stringify(buildClientProgressReportWorkflow(company), null, 2),
    },
    {
      name: "lead-qualification-contractor.workflow.json",
      content: JSON.stringify(buildLeadQualificationContractorWorkflow(company), null, 2),
    },
    { name: "README.md", content: buildReadme(company) },
  ];

  return createZipBuffer(files);
}
