import { readFileSync } from "fs";
import { join } from "path";
import { listActiveClientIds } from "../lib/clients";
import {
  generateMonthlyReport,
  getPreviousMonthReference,
} from "../lib/monthly-report";

function loadEnvLocal(): void {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local is optional for local runs
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  const dryRun = process.argv.includes("--dry-run");
  const { month, year } = getPreviousMonthReference();
  const clientIds = await listActiveClientIds();

  console.log(
    `[monthly-reports] ${dryRun ? "DRY-RUN " : ""}Generating reports for ${month}/${year} — ${clientIds.length} active client(s)`
  );

  let failures = 0;

  for (const clientId of clientIds) {
    try {
      const result = await generateMonthlyReport(clientId, month, year, {
        dryRun,
      });
      if (dryRun) {
        console.log(
          `[monthly-reports] ${clientId}: dry-run ok · runs=${result.metrics.totalRuns} · tasks=${result.metrics.totalTasksAutomated}`
        );
      } else {
        console.log(
          `[monthly-reports] ${clientId}: saved ${result.pdfPath} · emailSent=${result.emailSent} · runs=${result.metrics.totalRuns}`
        );
      }
    } catch (error) {
      failures += 1;
      console.error(`[monthly-reports] ${clientId}: failed`, error);
    }
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[monthly-reports] Fatal error:", error);
  process.exit(1);
});
