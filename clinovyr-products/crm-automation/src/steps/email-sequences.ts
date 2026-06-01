import type Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithJsonRetry } from "../claude-client.js";
import { recordApiCall } from "../hubspot-client.js";
import { getHubSpotClientForSetup } from "./audit.js";
import { formatHubSpotError } from "./audit.js";
import { writeJsonFile } from "../utils/output.js";
import { EmailCreateRequestStateEnum } from "@hubspot/api-client/lib/codegen/marketing/emails/models/EmailCreateRequest";
import type { EmailTemplateDraft, SetupContext, WorkflowStub } from "../types.js";

interface ClaudeEmailSequenceResponse {
  emails: Array<{
    day: number;
    name: string;
    subject: string;
    body: string;
  }>;
}

const SEQUENCE_DAYS = [0, 3, 7, 14, 21];

export async function runEmailSequencesStep(
  context: SetupContext,
  claudeClient: Anthropic,
): Promise<void> {
  console.log("\n=== STEP 4 — Email Sequences ===");

  const generated = await callClaudeWithJsonRetry<ClaudeEmailSequenceResponse>(
    claudeClient,
    `You write professional nurture email sequences for ${context.config.industry} businesses. Return JSON only with shape {"emails":[{"day":number,"name":string,"subject":string,"body":string}]}. Use warm, consultative tone. Each body should be 2-4 short paragraphs in plain text.`,
    `Create a 5-email nurture sequence for ${context.config.companyName} (${context.config.industry}). Days: ${SEQUENCE_DAYS.join(", ")}. Focus on building trust, addressing common objections, and driving consultation bookings.`,
  );

  recordApiCall(context.apiCalls, {
    step: "email-sequences",
    method: "POST",
    endpoint: "anthropic/messages (claude-sonnet-4-6)",
    status: "success",
    message: `${generated.emails.length} templates generated`,
  });

  const client = getHubSpotClientForSetup(context);
  const templates: EmailTemplateDraft[] = [];

  for (const email of generated.emails) {
    if (context.dryRun) {
      templates.push({
        day: email.day,
        name: email.name,
        subject: email.subject,
        body: email.body,
        status: "skipped",
        message: "Dry run — template not created in HubSpot",
      });
      recordApiCall(context.apiCalls, {
        step: "email-sequences",
        method: "POST",
        endpoint: "/marketing/v3/emails",
        status: "mock",
        message: email.name,
      });
      console.log(`  ○ Day ${email.day}: ${email.name} (dry run)`);
      continue;
    }

    try {
      const created = await client.marketing.emails.marketingEmailsApi.create({
        name: `${context.config.clientId}-day-${email.day}-${email.name}`,
        subject: email.subject,
        content: {
          templatePath: "@hubspot/email/dnd/default.html",
          widgets: {
            primary_body: {
              type: "rich_text",
              body: {
                html: email.body.replace(/\n/g, "<br/>"),
              },
            },
          },
        },
        state: EmailCreateRequestStateEnum.Draft,
      });

      templates.push({
        day: email.day,
        name: email.name,
        subject: email.subject,
        body: email.body,
        hubspotId: created.id,
        status: "created",
      });
      recordApiCall(context.apiCalls, {
        step: "email-sequences",
        method: "POST",
        endpoint: "/marketing/v3/emails",
        status: "success",
        message: created.id,
      });
      console.log(`  ✓ Day ${email.day}: ${email.name} (HubSpot ID: ${created.id})`);
    } catch (error) {
      const message = formatHubSpotError(error);
      templates.push({
        day: email.day,
        name: email.name,
        subject: email.subject,
        body: email.body,
        status: "exported",
        message,
      });
      recordApiCall(context.apiCalls, {
        step: "email-sequences",
        method: "POST",
        endpoint: "/marketing/v3/emails",
        status: "error",
        message,
      });
      console.log(`  ○ Day ${email.day}: exported locally (${message})`);
    }
  }

  const exportPath = writeJsonFile(
    `output/email-sequence-${context.config.clientId}.json`,
    templates,
  );

  const enrollmentStub: WorkflowStub = {
    name: `${context.config.companyName} — New Lead Email Sequence`,
    trigger: "Contact lifecycle stage is set to Lead AND ai_lead_score is known",
    actions: [
      "Delay 0 days → send Day 0 email",
      "Delay 3 days → send Day 3 email",
      "Delay 7 days → send Day 7 email",
      "Delay 14 days → send Day 14 email",
      "Delay 21 days → send Day 21 email",
    ],
    manualSteps: [
      "HubSpot → Automation → Workflows → Create workflow → Contact-based",
      "Enrollment: Lifecycle stage is Lead, exclude contacts already in sequence",
      "Add delay/send marketing email actions referencing templates from this setup",
      "Use marketing email IDs from output/email-sequence JSON if created via API",
      "Set last_contacted_by_ai when each automated email sends",
    ],
  };

  writeJsonFile(
    `output/workflow-stub-email-sequence-${context.config.clientId}.json`,
    enrollmentStub,
  );

  context.emailSequences = templates;
  console.log(`  Templates exported: ${exportPath}`);
  console.log(
    `  Summary: ${templates.filter((item) => item.status === "created").length} in HubSpot, ${templates.filter((item) => item.status === "exported" || item.status === "skipped").length} exported/skipped`,
  );
}
