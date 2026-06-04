import type { Company, Survey } from "@prisma/client";
import { createZipBuffer } from "@/lib/deliverables/generators/shared";
import { companySlug } from "@/lib/deliverables/generators/industries/real-estate-shared";

function substituteCompany(
  blueprint: Record<string, unknown>,
  company: Company,
): Record<string, unknown> {
  const json = JSON.stringify(blueprint);
  const replaced = json
    .replace(/\{\{COMPANY_NAME\}\}/g, company.name)
    .replace(/\{\{BROKERAGE_SLUG\}\}/g, companySlug(company.name));
  return JSON.parse(replaced) as Record<string, unknown>;
}

export function buildLeadQualifierRealtorBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Lead Qualifier (Zillow → Claude → SMS/Drip)",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "zillow-lead-inbound", maxResults: 1 },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            note: "Zillow/Realtor.com lead webhook or CRM new-lead trigger",
          },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            leadName: "{{1.body.contactName}}",
            leadPhone: "{{1.body.phone}}",
            leadEmail: "{{1.body.email}}",
            leadMessage: "{{1.body.message}}",
            propertyInterest: "{{1.body.propertyAddress}}",
            leadSource: "{{1.body.source}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 512 },
          mapper: {
            system:
              "Score real estate leads 1-10 on intent. Output JSON: {score, timeline, budget, motivation, hot:boolean, smsReply, agentNotes}",
            messages: [
              {
                role: "user",
                content:
                  "Lead: {{2.leadName}} | Message: {{2.leadMessage}} | Property: {{2.propertyInterest}} | Source: {{2.leadSource}}",
              },
            ],
          },
          metadata: { designer: { x: 560, y: 0 }, note: "Claude scores lead intent" },
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
            to: "{{2.leadPhone}}",
            body: "{{3.content[0].text.smsReply}}",
          },
          metadata: {
            designer: { x: 840, y: -80 },
            note: "Instant auto-reply within 60 seconds",
          },
        },
        {
          id: 5,
          module: "builtin:BasicRouter",
          version: 1,
          parameters: {},
          mapper: {
            condition: "{{if(3.content[0].text.hot; true; false)}}",
          },
          metadata: { designer: { x: 1120, y: 0 }, note: "Route hot leads to on-call agent" },
        },
        {
          id: 6,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: { accountSid: "{{API_KEY_TWILIO}}", from: "{{TWILIO_FROM_NUMBER}}" },
          mapper: {
            to: "{{ON_CALL_AGENT_PHONE}}",
            body: "HOT LEAD: {{2.leadName}} scored {{3.content[0].text.score}}/10 — {{2.leadPhone}} — {{2.propertyInterest}}",
          },
          metadata: { designer: { x: 1400, y: -80 } },
        },
        {
          id: 7,
          module: "http:ActionSendData",
          version: 3,
          parameters: { url: "{{CRM_WEBHOOK_URL}}", method: "POST" },
          mapper: {
            name: "{{2.leadName}}",
            phone: "{{2.leadPhone}}",
            email: "{{2.leadEmail}}",
            score: "{{3.content[0].text.score}}",
            notes: "{{3.content[0].text.agentNotes}}",
            tags: "{{if(3.content[0].text.hot; 'hot-lead'; 'nurture')}}",
          },
          metadata: { designer: { x: 1400, y: 80 }, note: "Push to GoHighLevel/FUB/HubSpot" },
        },
        {
          id: 8,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 259200 },
          mapper: {},
          metadata: { designer: { x: 1680, y: 120 }, note: "72h drip if no agent contact logged" },
        },
        {
          id: 9,
          module: "twilio:CreateMessage",
          version: 2,
          parameters: { accountSid: "{{API_KEY_TWILIO}}", from: "{{TWILIO_FROM_NUMBER}}" },
          mapper: {
            to: "{{2.leadPhone}}",
            body: "{{COMPANY_NAME}}: Still exploring {{2.propertyInterest}}? I have new listings in your range — reply YES for options.",
          },
          metadata: { designer: { x: 1960, y: 120 } },
        },
        {
          id: 10,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Lead Log" },
          mapper: {
            values: [
              "{{now}}",
              "{{2.leadName}}",
              "{{2.leadPhone}}",
              "{{3.content[0].text.score}}",
              "{{2.leadSource}}",
              "auto-reply+drip",
            ],
          },
          metadata: { designer: { x: 2240, y: 0 } },
        },
      ],
      metadata: {
        templateId: "lead-qualifier-realtor",
        industry: "Real Estate",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{API_KEY_TWILIO}}",
          "{{TWILIO_FROM_NUMBER}}",
          "{{ON_CALL_AGENT_PHONE}}",
          "{{CRM_WEBHOOK_URL}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildListingDescriptionBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Listing Description Generator",
      flow: [
        {
          id: 1,
          module: "google-forms:watchResponses",
          version: 2,
          parameters: { formId: "{{GOOGLE_FORM_ID}}" },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            note: "Agent submits listing intake via Google Form",
          },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            address: "{{1.responses.address}}",
            sqft: "{{1.responses.sqft}}",
            beds: "{{1.responses.beds}}",
            baths: "{{1.responses.baths}}",
            features: "{{1.responses.features}}",
            price: "{{1.responses.price}}",
            agentEmail: "{{1.responses.agentEmail}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 1500 },
          mapper: {
            system:
              "Write 3 MLS listing descriptions (luxury, family, investor angles). Fair Housing compliant. JSON: {variation1, variation2, variation3, socialSnippet}",
            messages: [
              {
                role: "user",
                content:
                  "Address: {{2.address}} | {{2.beds}}bd/{{2.baths}}ba | {{2.sqft}} sqft | Features: {{2.features}} | Price: {{2.price}}",
              },
            ],
          },
          metadata: { designer: { x: 560, y: 0 } },
        },
        {
          id: 4,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.agentEmail}}",
            subject: "Listing descriptions ready — {{2.address}}",
          },
          mapper: {
            body: "Variation 1 (Luxury):\n{{3.content[0].text.variation1}}\n\nVariation 2 (Family):\n{{3.content[0].text.variation2}}\n\nVariation 3 (Investor):\n{{3.content[0].text.variation3}}",
          },
          metadata: { designer: { x: 840, y: -60 } },
        },
        {
          id: 5,
          module: "buffer:createUpdate",
          version: 1,
          parameters: { profileIds: ["{{BUFFER_PROFILE_ID}}"] },
          mapper: {
            text: "{{3.content[0].text.socialSnippet}} — {{2.address}} | Listed with {{COMPANY_NAME}}",
            scheduledAt: "{{addHours(now; 2)}}",
          },
          metadata: {
            designer: { x: 840, y: 60 },
            note: "Schedule social post 2h after generation",
          },
        },
        {
          id: 6,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Listing Copy Log" },
          mapper: {
            values: ["{{now}}", "{{2.address}}", "{{2.price}}", "{{2.agentEmail}}", "3 variations"],
          },
          metadata: { designer: { x: 1120, y: 0 } },
        },
      ],
      metadata: {
        templateId: "listing-description-generator",
        industry: "Real Estate",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{GOOGLE_FORM_ID}}",
          "{{EMAIL_PROVIDER}}",
          "{{BUFFER_PROFILE_ID}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

export function buildPostCloseFollowupBlueprint(
  company: Company,
): Record<string, unknown> {
  return substituteCompany(
    {
      name: "{{COMPANY_NAME}} - Post-Close Follow-Up Sequence",
      flow: [
        {
          id: 1,
          module: "gateway:CustomWebHook",
          version: 1,
          parameters: { hook: "crm-deal-closed", maxResults: 1 },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            note: "CRM fires when transaction status = Closed",
          },
        },
        {
          id: 2,
          module: "util:SetVariable2",
          version: 1,
          parameters: {},
          mapper: {
            clientName: "{{1.body.clientName}}",
            clientEmail: "{{1.body.clientEmail}}",
            clientPhone: "{{1.body.clientPhone}}",
            propertyAddress: "{{1.body.propertyAddress}}",
            closeDate: "{{1.body.closeDate}}",
            agentName: "{{1.body.agentName}}",
            side: "{{1.body.side}}",
          },
          metadata: { designer: { x: 280, y: 0 } },
        },
        {
          id: 3,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 2592000 },
          mapper: {},
          metadata: { designer: { x: 560, y: -120 }, note: "30 days post-close check-in" },
        },
        {
          id: 4,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system: "Write a warm 30-day post-close check-in email under 120 words. Personal, not templated.",
            messages: [
              {
                role: "user",
                content:
                  "Client: {{2.clientName}} | Property: {{2.propertyAddress}} | Side: {{2.side}} | Agent: {{2.agentName}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: -120 } },
        },
        {
          id: 5,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.clientEmail}}",
            subject: "Checking in — {{2.propertyAddress}}",
          },
          mapper: { body: "{{4.content[0].text}}" },
          metadata: { designer: { x: 1120, y: -120 } },
        },
        {
          id: 6,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 28512000 },
          mapper: {},
          metadata: {
            designer: { x: 560, y: 0 },
            note: "~11 months — home anniversary",
          },
        },
        {
          id: 7,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 400 },
          mapper: {
            system:
              "Write an 11-month home anniversary email with a soft home value update offer. Under 130 words.",
            messages: [
              {
                role: "user",
                content: "Client: {{2.clientName}} | Address: {{2.propertyAddress}} | Close: {{2.closeDate}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: 0 } },
        },
        {
          id: 8,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.clientEmail}}",
            subject: "Happy home anniversary — {{2.propertyAddress}}",
          },
          mapper: { body: "{{7.content[0].text}}" },
          metadata: { designer: { x: 1120, y: 0 } },
        },
        {
          id: 9,
          module: "tools:Sleep",
          version: 1,
          parameters: { delay: 5184000 },
          mapper: {},
          metadata: { designer: { x: 560, y: 120 }, note: "60 days after anniversary — referral ask" },
        },
        {
          id: 10,
          module: "anthropic:CreateMessage",
          version: 1,
          parameters: { model: "claude-sonnet-4-6", max_tokens: 350 },
          mapper: {
            system:
              "Write a referral request email. Grateful tone, specific ask, under 100 words. Include reply-to-agent option.",
            messages: [
              {
                role: "user",
                content: "Client: {{2.clientName}} | Agent: {{2.agentName}} | {{COMPANY_NAME}}",
              },
            ],
          },
          metadata: { designer: { x: 840, y: 120 } },
        },
        {
          id: 11,
          module: "{{EMAIL_PROVIDER}}:sendEmail",
          version: 1,
          parameters: {
            to: "{{2.clientEmail}}",
            subject: "Know anyone buying or selling in Placer County?",
          },
          mapper: { body: "{{10.content[0].text}}" },
          metadata: { designer: { x: 1120, y: 120 } },
        },
        {
          id: 12,
          module: "google-sheets:addRow",
          version: 2,
          parameters: { spreadsheet: "{{GOOGLE_SHEET_ID}}", sheet: "Post-Close Sequence" },
          mapper: {
            values: [
              "{{now}}",
              "{{2.clientName}}",
              "{{2.propertyAddress}}",
              "{{2.closeDate}}",
              "30d+11mo+referral queued",
            ],
          },
          metadata: { designer: { x: 1400, y: 0 } },
        },
      ],
      metadata: {
        templateId: "post-close-followup",
        industry: "Real Estate",
        placeholders: [
          "{{COMPANY_NAME}}",
          "{{EMAIL_PROVIDER}}",
          "{{GOOGLE_SHEET_ID}}",
        ],
      },
    },
    company,
  );
}

function buildReadme(company: Company): string {
  return `# ${company.name} — Real Estate Automation Blueprints

Generated by Clinovyr for Make.com import.

## Files

1. **lead-qualifier-realtor.blueprint.json** — Zillow/portal webhook → Claude lead score → instant SMS auto-reply → hot-lead agent alert → CRM update → 72h drip → Google Sheets log
2. **listing-description-generator.blueprint.json** — Google Form intake → Claude 3 MLS variations → email to agent → Buffer social post → Sheets log
3. **post-close-followup.blueprint.json** — CRM closed deal webhook → 30-day check-in → 11-month home anniversary → referral sequence → Sheets log

## Import into Make.com

1. Log in at [make.com](https://www.make.com) → **Scenarios** → **Create a new scenario**
2. Click the **⋯** menu → **Import Blueprint**
3. Select the matching \`.blueprint.json\` file
4. Replace placeholders: Twilio, Anthropic API, CRM webhook URL, Google Form/Sheet IDs, Buffer profile
5. Run **Test once** with sample webhook payload before enabling

## Real estate compliance reminder

- Ensure auto-replies comply with TCPA (prior consent for SMS marketing)
- Review all AI-generated listing copy for Fair Housing Act compliance before MLS submission
- DRE advertising rules apply to California marketing — include license numbers where required

## Support

Clinovyr · clinovyr.com · clinovyr@gmail.com · Granite Bay, CA
`;
}

export async function createRealEstateBlueprintZip(
  company: Company,
  survey: Survey,
): Promise<Buffer> {
  void survey;
  const files: Array<{ name: string; content: string }> = [
    {
      name: "lead-qualifier-realtor.blueprint.json",
      content: JSON.stringify(buildLeadQualifierRealtorBlueprint(company), null, 2),
    },
    {
      name: "listing-description-generator.blueprint.json",
      content: JSON.stringify(buildListingDescriptionBlueprint(company), null, 2),
    },
    {
      name: "post-close-followup.blueprint.json",
      content: JSON.stringify(buildPostCloseFollowupBlueprint(company), null, 2),
    },
    { name: "README.md", content: buildReadme(company) },
  ];

  return createZipBuffer(files);
}
