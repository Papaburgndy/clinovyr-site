import { loadClientConfig, parseCliArgs, resolveAnthropicApiKey } from "./src/config.js";
import { createClaudeClient } from "./src/claude-client.js";
import { ensureOutputDir } from "./src/utils/output.js";
import { runAuditStep } from "./src/steps/audit.js";
import { runPropertiesStep } from "./src/steps/properties.js";
import { runLeadScoringStep } from "./src/steps/lead-scoring.js";
import { runEmailSequencesStep } from "./src/steps/email-sequences.js";
import { runDashboardStep } from "./src/steps/dashboard.js";
import { runReportStep } from "./src/steps/report.js";
import type { SetupContext } from "./src/types.js";

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const config = loadClientConfig(options.clientConfigPath);

  console.log("Clinovyr HubSpot CRM Automation");
  console.log("================================");
  console.log(`Client: ${config.companyName} (${config.clientId})`);
  console.log(`Industry: ${config.industry}`);
  console.log(`Mode: ${options.dryRun ? "DRY RUN (no HubSpot writes)" : "LIVE"}`);

  ensureOutputDir();

  const context: SetupContext = {
    config,
    dryRun: options.dryRun,
    apiCalls: [],
    properties: [],
    emailSequences: [],
    dashboard: { name: "", widgets: [] },
    startedAt: new Date().toISOString(),
  };

  const anthropicApiKey = resolveAnthropicApiKey(config);
  const claudeClient = createClaudeClient(anthropicApiKey);

  await runAuditStep(context);
  await runPropertiesStep(context);
  await runLeadScoringStep(context, claudeClient);
  await runEmailSequencesStep(context, claudeClient);
  await runDashboardStep(context);
  await runReportStep(context);

  console.log("\n================================");
  console.log("CRM setup complete.");
  console.log(`Report: output/setup-complete-${config.clientId}.md`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nFatal error: ${message}`);
  process.exit(1);
});
