import type { Client } from "@hubspot/api-client";
import {
  createHubSpotClient,
  fetchWorkflows,
  formatHubSpotError,
  recordApiCall,
  safeHubSpotCall,
} from "../hubspot-client.js";
import { writeJsonFile } from "../utils/output.js";
import type { AuditData, SetupContext } from "../types.js";

function summarizeCount(data: unknown, key = "results"): number {
  if (!data || typeof data !== "object") {
    return 0;
  }

  const record = data as Record<string, unknown>;
  if (Array.isArray(record[key])) {
    return record[key].length;
  }

  if (Array.isArray(record.total)) {
    return record.total.length;
  }

  if (Array.isArray(data)) {
    return data.length;
  }

  return 0;
}

export async function runAuditStep(context: SetupContext): Promise<void> {
  console.log("\n=== STEP 1 — Audit ===");

  const client = createHubSpotClient(context.config.hubspotApiKey);
  const errors: string[] = [];

  let contactProperties: unknown = null;
  let workflows: unknown = null;
  let emailTemplates: unknown = null;
  let pipelines: unknown = null;

  const propertiesResult = await safeHubSpotCall("Contact properties", () =>
    client.crm.properties.coreApi.getAll("contacts"),
  );
  if (propertiesResult.error) {
    errors.push(propertiesResult.error);
    console.log(`  ✗ Contact properties: ${propertiesResult.error}`);
  } else {
    contactProperties = propertiesResult.data;
    const count = summarizeCount(contactProperties);
    console.log(`  ✓ Contact properties fetched (${count} properties)`);
    recordApiCall(context.apiCalls, {
      step: "audit",
      method: "GET",
      endpoint: "/crm/v3/properties/contacts",
      status: "success",
      message: `${count} properties`,
    });
  }

  const workflowsResult = await safeHubSpotCall("Workflows", () =>
    fetchWorkflows(client),
  );
  if (workflowsResult.error) {
    errors.push(workflowsResult.error);
    console.log(`  ✗ Workflows: ${workflowsResult.error}`);
    recordApiCall(context.apiCalls, {
      step: "audit",
      method: "GET",
      endpoint: "/automation/v4/flows (fallback v3)",
      status: "error",
      message: workflowsResult.error,
    });
  } else {
    workflows = workflowsResult.data;
    const count = summarizeCount(workflows);
    console.log(`  ✓ Workflows fetched (${count} flows)`);
    recordApiCall(context.apiCalls, {
      step: "audit",
      method: "GET",
      endpoint: "/automation/v4/flows",
      status: "success",
      message: `${count} workflows`,
    });
  }

  const emailsResult = await safeHubSpotCall("Marketing emails", () =>
    client.marketing.emails.marketingEmailsApi.getPage(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      100,
    ),
  );
  if (emailsResult.error) {
    errors.push(emailsResult.error);
    console.log(`  ✗ Email templates: ${emailsResult.error}`);
  } else {
    emailTemplates = emailsResult.data;
    const count = summarizeCount(emailTemplates);
    console.log(`  ✓ Marketing emails fetched (${count} templates)`);
    recordApiCall(context.apiCalls, {
      step: "audit",
      method: "GET",
      endpoint: "/marketing/v3/emails",
      status: "success",
      message: `${count} emails`,
    });
  }

  const pipelinesResult = await safeHubSpotCall("Deal pipelines", () =>
    client.crm.pipelines.pipelinesApi.getAll("deals"),
  );
  if (pipelinesResult.error) {
    errors.push(pipelinesResult.error);
    console.log(`  ✗ Pipelines: ${pipelinesResult.error}`);
  } else {
    pipelines = pipelinesResult.data;
    const count = summarizeCount(pipelines);
    console.log(`  ✓ Deal pipelines fetched (${count} pipelines)`);
    recordApiCall(context.apiCalls, {
      step: "audit",
      method: "GET",
      endpoint: "/crm/v3/pipelines/deals",
      status: "success",
      message: `${count} pipelines`,
    });
  }

  const audit: AuditData = {
    contactProperties,
    workflows,
    emailTemplates,
    pipelines,
    fetchedAt: new Date().toISOString(),
    errors,
  };

  context.audit = audit;

  const outputPath = writeJsonFile(
    `output/crm-audit-${context.config.clientId}.json`,
    audit,
  );

  console.log(`\n  Audit summary for ${context.config.companyName}:`);
  console.log(`    - Contact properties: ${summarizeCount(contactProperties)}`);
  console.log(`    - Workflows: ${summarizeCount(workflows)}`);
  console.log(`    - Email templates: ${summarizeCount(emailTemplates)}`);
  console.log(`    - Pipelines: ${summarizeCount(pipelines)}`);
  if (errors.length > 0) {
    console.log(`    - Errors: ${errors.length} (see audit JSON for details)`);
  }
  console.log(`  Exported: ${outputPath}`);
}

export function getHubSpotClientForSetup(context: SetupContext): Client {
  return createHubSpotClient(context.config.hubspotApiKey);
}

export { formatHubSpotError };
