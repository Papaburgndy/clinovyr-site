import fs from "fs/promises";
import path from "path";
import {
  aggregateKpisFromRuns,
  computeHoursSaved,
} from "@/lib/kpi-aggregation";
import type { Automation, ClientConfig, RunRecord } from "@/lib/types";

export const KPI_TEST_CLIENT_ID = "kpi-test-client";
const DATA_DIR = path.join(process.cwd(), "data", "clients", KPI_TEST_CLIENT_ID);

export async function seedKpiTestClient(): Promise<void> {
  const runsDir = path.join(DATA_DIR, "runs");
  await fs.mkdir(runsDir, { recursive: true });

  const automations: Automation[] = [
    {
      id: "kpi-auto-1",
      name: "KPI Test Automation",
      description: "Test automation for KPI aggregation",
      status: "running",
      runCount: 50,
      successRate: 100,
      lastRun: "2026-06-01T12:00:00Z",
      lastError: null,
      tasksThisMonth: 500,
      recentRuns: [],
    },
  ];

  const runs: RunRecord[] = [];
  for (let i = 1; i <= 50; i++) {
    runs.push({
      id: `kpi-run-${i}`,
      automationId: "kpi-auto-1",
      automationName: "KPI Test Automation",
      timestamp: `2026-06-01T${String(8 + (i % 10)).padStart(2, "0")}:00:00Z`,
      status: "success",
      tasksProcessed: 10,
      durationMs: 3000,
    });
  }

  const aggregated = aggregateKpisFromRuns(runs, automations);
  const config: ClientConfig = {
    clientName: "KPI Test Client",
    email: "kpi-test@clinovyr.test",
    plan: "starter",
    mrr: 999,
    active: true,
    escalationEmail: "kpi-test@clinovyr.test",
    businessHours: {
      monday: { open: "09:00", close: "17:00" },
      tuesday: { open: "09:00", close: "17:00" },
      wednesday: { open: "09:00", close: "17:00" },
      thursday: { open: "09:00", close: "17:00" },
      friday: { open: "09:00", close: "17:00" },
      saturday: null,
      sunday: null,
    },
    faq: [],
  };

  await fs.writeFile(
    path.join(DATA_DIR, "config.json"),
    JSON.stringify(config, null, 2)
  );
  await fs.writeFile(
    path.join(DATA_DIR, "automations.json"),
    JSON.stringify(automations, null, 2)
  );
  await fs.writeFile(
    path.join(DATA_DIR, "kpis.json"),
    JSON.stringify(
      { ...aggregated, tasksByMonth: [{ month: "Jun", tasks: 500 }] },
      null,
      2
    )
  );
  await fs.writeFile(path.join(DATA_DIR, "activity.json"), "[]");
  await fs.writeFile(path.join(DATA_DIR, "reports.json"), "[]");

  for (const run of runs) {
    await fs.writeFile(
      path.join(runsDir, `${run.id}.json`),
      JSON.stringify(run, null, 2)
    );
  }

  if (aggregated.tasksAutomated !== 500) {
    throw new Error(`Expected 500 tasks, got ${aggregated.tasksAutomated}`);
  }
  if (computeHoursSaved(500) !== aggregated.hoursSaved) {
    throw new Error("hoursSaved mismatch during seed");
  }
}

export async function removeKpiTestClient(): Promise<void> {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
}
