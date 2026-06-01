import type Anthropic from "@anthropic-ai/sdk";
import { callClaudeWithJsonRetry } from "../claude-client.js";
import { recordApiCall } from "../hubspot-client.js";
import { writeJsonFile } from "../utils/output.js";
import type { LeadData, LeadScoreResult, SetupContext, WorkflowStub } from "../types.js";

interface ClaudeScoreResponse {
  score: number;
  reason: string;
}

export async function scoreLead(
  client: Anthropic,
  leadData: LeadData,
  industry: string,
): Promise<LeadScoreResult> {
  const response = await callClaudeWithJsonRetry<ClaudeScoreResponse>(
    client,
    `You are a CRM lead scoring analyst for ${industry} businesses. Score leads from 1-100 based on fit, intent, and urgency. Return JSON only: {"score": number, "reason": string}.`,
    `Score this lead:\n${JSON.stringify(leadData, null, 2)}`,
  );

  const score = Math.min(100, Math.max(1, Math.round(response.score)));

  return {
    score,
    reason: response.reason,
  };
}

function buildWorkflowStub(companyName: string): WorkflowStub {
  return {
    name: `${companyName} — AI Lead Scoring`,
    trigger: "Contact lifecycle stage is set to Lead",
    actions: [
      "When contact enters Lead stage, call external webhook or custom code action with contact properties",
      "Write ai_lead_score and lead_source_detail from scoreLead() response",
      "If ai_lead_score >= 70, set escalate_to_human to true and notify owner",
      "If ai_lead_score < 40, enroll contact in nurture email sequence",
    ],
    manualSteps: [
      "HubSpot → Automation → Workflows → Create workflow → Contact-based",
      "Enrollment trigger: Lifecycle stage is any of Lead",
      "Re-enrollment: Allow contacts to re-enroll",
      "Add action: Set contact property ai_lead_score (requires custom code or webhook integration)",
      "Alternative: Use Operations Hub custom coded action calling scoreLead() via your middleware",
      "Add branch: If ai_lead_score is greater than or equal to 70 → create task for owner",
      "Add branch: If ai_lead_score is less than 40 → enroll in email sequence workflow",
    ],
  };
}

export async function runLeadScoringStep(
  context: SetupContext,
  claudeClient: Anthropic,
): Promise<void> {
  console.log("\n=== STEP 3 — AI Lead Scoring ===");

  const sampleLead: LeadData = {
    firstName: "Sample",
    lastName: "Lead",
    email: "sample.lead@example.com",
    company: context.config.companyName,
    industry: context.config.industry,
    leadSource: "Website form",
    notes: "Requested pricing information and mentioned urgent timeline.",
  };

  let sampleScore: LeadScoreResult | undefined;

  try {
    sampleScore = await scoreLead(
      claudeClient,
      sampleLead,
      context.config.industry,
    );
    console.log(`  ✓ Sample lead scored: ${sampleScore.score}/100`);
    console.log(`    Reason: ${sampleScore.reason}`);
    recordApiCall(context.apiCalls, {
      step: "lead-scoring",
      method: "POST",
      endpoint: "anthropic/messages (claude-sonnet-4-6)",
      status: "success",
      message: `Sample score ${sampleScore.score}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  ✗ Lead scoring failed: ${message}`);
    recordApiCall(context.apiCalls, {
      step: "lead-scoring",
      method: "POST",
      endpoint: "anthropic/messages (claude-sonnet-4-6)",
      status: "error",
      message,
    });
  }

  const workflowStub = buildWorkflowStub(context.config.companyName);

  if (context.dryRun) {
    console.log("  ○ Workflow creation skipped (dry run — HubSpot workflow API is limited)");
    recordApiCall(context.apiCalls, {
      step: "lead-scoring",
      method: "POST",
      endpoint: "/automation/v4/flows",
      status: "mock",
      message: "Dry run — workflow stub exported",
    });
  } else {
    console.log(
      "  ○ HubSpot workflow creation via public API is limited — exporting workflow stub for manual setup",
    );
    recordApiCall(context.apiCalls, {
      step: "lead-scoring",
      method: "POST",
      endpoint: "/automation/v4/flows",
      status: "skipped",
      message: "Workflow must be created manually in HubSpot UI",
    });
  }

  const stubPath = writeJsonFile(
    `output/workflow-stub-lead-scoring-${context.config.clientId}.json`,
    workflowStub,
  );

  context.leadScoring = { sampleScore, workflowStub };
  console.log(`  Workflow stub exported: ${stubPath}`);
  console.log(`  Manual steps: ${workflowStub.manualSteps.length} documented in stub`);
}
