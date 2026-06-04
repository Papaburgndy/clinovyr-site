import type { Company } from "@prisma/client";
import { companySlug } from "@/lib/deliverables/generators/industries/retail-shared";

function substituteCompany(
  blueprint: Record<string, unknown>,
  company: Company,
): Record<string, unknown> {
  const json = JSON.stringify(blueprint);
  const replaced = json
    .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
    .replace(/\{\{STORE_SLUG\}\}/g, companySlug(company.name));
  return JSON.parse(replaced) as Record<string, unknown>;
}

/** Make.com blueprint: post-purchase review request + low-star alert. */
export function buildRetailReviewMonitoringBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Post-Purchase Review Request (POS/Klaviyo → Claude → SMS + Email)",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "order-completed", maxResults: 1 },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            note: "Shopify/Square/Klaviyo Placed Order event",
          },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            customerName: "{{1.body.customerName}}",
            customerPhone: "{{1.body.customerPhone}}",
            customerEmail: "{{1.body.customerEmail}}",
            orderTotal: "{{1.body.orderTotal}}",
            topItem: "{{1.body.topItem}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 172800 },
          mapper: {},
          metadata: { designer: { x: 560, y: 0 }, note: "48h after purchase — review window" },
        },
        {
          id: 4,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system:
              "Write a warm post-purchase review request for a local retail or restaurant customer. Reference their purchase item if provided. Under 160 chars for SMS variant. Include [GOOGLE_REVIEW_LINK] placeholder. No incentives for reviews.",
            messages: [
              {
                role: "user",
                content:
                  "Customer: {{2.customerName}} | Item: {{2.topItem}} | Order: ${{2.orderTotal}} | {{COMPANY_NAME}} Roseville area",
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
            to: "{{2.customerPhone}}",
            body: "{{4.content[0].text}}",
          },
          metadata: { designer: { x: 1120, y: -80 } },
        },
        {
          id: 6,
          module: "klaviyo:createEvent",
          version: 1,
          parameters: { apiKey: "{{KLAVIYO_API_KEY}}" },
          mapper: {
            profileEmail: "{{2.customerEmail}}",
            metricName: "Review Request Sent",
            properties: { channel: "sms+email", company: "{{COMPANY_NAME}}" },
          },
          metadata: { designer: { x: 1120, y: 80 }, note: "Log event in Klaviyo" },
        },
        {
          id: 7,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{REVIEW_LOG_SHEET_ID}}" },
          mapper: {
            values: [
              "{{now}}",
              "{{2.customerName}}",
              "{{2.customerEmail}}",
              "request_sent",
              "{{2.topItem}}",
            ],
          },
          metadata: { designer: { x: 1400, y: 0 } },
        },
      ],
      metadata: {
        version: 1,
        scenario: {
          roundtrips: 1,
          maxErrors: 3,
          autoCommit: true,
        },
        designer: { orphans: [] },
      },
    },
    company,
  );
}

export function getRetailReviewBlueprintReadme(company: Company): string {
  return `# {{COMPANY_NAME}} — Review Monitoring Blueprint

## File
- **review-request-retail.blueprint.json** — Post-purchase → 48h wait → Claude review request SMS → Klaviyo event log → Google Sheets

## Setup (~60 min)
1. Import blueprint into Make.com
2. Connect Shopify/Square webhook on \`order.completed\` OR Klaviyo "Placed Order" flow trigger
3. Add Anthropic + Twilio + Klaviyo + Google Sheets connections
4. Replace \`[GOOGLE_REVIEW_LINK]\` with your Google Business Profile review URL
5. Test with a $1 internal order

## Low-star alert (add module 8)
- Google Business Profile new review webhook → Filter stars ≤ 3 → Slack #reviews channel + email owner within 1 hour

Prepared by Clinovyr · clinovyr.com
`.replace(/\{\{COMPANY_NAME\}\}/g, company.name);
}
