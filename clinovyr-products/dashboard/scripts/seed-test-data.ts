/**
 * Seeds realistic mock client data under data/clients/.
 * Run: npx ts-node scripts/seed-test-data.ts
 */

import fs from "fs/promises";
import path from "path";
import type {
  ActivityEvent,
  Automation,
  AutomationRun,
  AutomationStatus,
  ClientConfig,
  ClientPlan,
  DashboardKpis,
  RunRecord,
} from "../src/lib/types";
import { aggregateKpisFromRuns } from "../src/lib/kpi-aggregation";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

type ClientSeedSpec = {
  clientId: string;
  clientName: string;
  email: string;
  plan: ClientPlan;
  planLabel: string;
  mrr: number;
  monthsHistory: number;
  automationDefs: Array<{
    id: string;
    name: string;
    description: string;
    status: AutomationStatus;
  }>;
};

const CLIENTS: ClientSeedSpec[] = [
  {
    clientId: "granite-bay-dental",
    clientName: "Granite Bay Dental",
    email: "ops@granitebaydental.test",
    plan: "growth",
    planLabel: "Standard",
    mrr: 1999,
    monthsHistory: 3,
    automationDefs: [
      {
        id: "gbd-intake",
        name: "New Patient Intake",
        description: "Processes intake forms and verifies insurance eligibility.",
        status: "running",
      },
      {
        id: "gbd-reminders",
        name: "Appointment Reminders",
        description: "Sends SMS and email reminders 48h and 24h before visits.",
        status: "running",
      },
      {
        id: "gbd-recall",
        name: "Hygiene Recall Outreach",
        description: "Identifies overdue patients and drafts recall messages.",
        status: "running",
      },
      {
        id: "gbd-referrals",
        name: "Specialist Referral Drafts",
        description: "Drafts referral letters from visit notes for review.",
        status: "running",
      },
      {
        id: "gbd-billing",
        name: "Claim Prep Assistant",
        description: "Pre-fills claim forms and flags missing documentation.",
        status: "error",
      },
      {
        id: "gbd-reviews",
        name: "Post-Visit Review Requests",
        description: "Sends review invitations after completed appointments.",
        status: "paused",
      },
    ],
  },
  {
    clientId: "roseville-realty",
    clientName: "Roseville Realty Group",
    email: "team@rosevillerealty.test",
    plan: "enterprise",
    planLabel: "Fractional CAIO",
    mrr: 5499,
    monthsHistory: 6,
    automationDefs: [
      {
        id: "rrg-leads",
        name: "Lead Qualification",
        description: "Scores inbound leads and routes hot prospects to agents.",
        status: "running",
      },
      {
        id: "rrg-listings",
        name: "Listing Description Generator",
        description: "Drafts MLS-ready listing copy from property notes.",
        status: "running",
      },
      {
        id: "rrg-followup",
        name: "Buyer Follow-Up Sequences",
        description: "Personalized nurture emails based on search activity.",
        status: "running",
      },
      {
        id: "rrg-docs",
        name: "Transaction Document Prep",
        description: "Assembles disclosure packets from CRM milestones.",
        status: "running",
      },
    ],
  },
  {
    clientId: "sierra-construction",
    clientName: "Sierra Construction",
    email: "ops@sierraconstruction.test",
    plan: "growth",
    planLabel: "Standard",
    mrr: 1999,
    monthsHistory: 1,
    automationDefs: [
      {
        id: "sc-bid",
        name: "Bid Request Triage",
        description: "Classifies inbound bid requests and assigns project managers.",
        status: "running",
      },
      {
        id: "sc-schedule",
        name: "Crew Schedule Sync",
        description: "Syncs field crew assignments with project timelines.",
        status: "running",
      },
      {
        id: "sc-invoice",
        name: "Progress Invoice Drafts",
        description: "Drafts progress invoices from job cost data.",
        status: "running",
      },
    ],
  },
];

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isoAt(date: Date, hour: number, minute = 0): string {
  const d = new Date(date);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function generateRunsForClient(
  spec: ClientSeedSpec,
  automations: Automation[]
): RunRecord[] {
  const runs: RunRecord[] = [];
  const end = new Date();
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - spec.monthsHistory);
  start.setUTCDate(1);

  let runIndex = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const weekend = isWeekend(cursor);
    const dailyRuns = weekend ? randomBetween(0, 2) : randomBetween(2, 6);

    for (let i = 0; i < dailyRuns; i++) {
      const automation =
        automations[runIndex % automations.length] ??
        automations[0];
      const errorChance = weekend ? 0.08 : 0.04;
      const isError = Math.random() < errorChance;
      const tasksProcessed = isError
        ? 0
        : weekend
          ? randomBetween(1, 4)
          : randomBetween(3, 18);
      const durationMs = isError
        ? randomBetween(400, 2000)
        : randomBetween(2000, 22000);

      runs.push({
        id: `${spec.clientId}-run-${++runIndex}`,
        automationId: automation.id,
        automationName: automation.name,
        timestamp: isoAt(cursor, randomBetween(7, 18), randomBetween(0, 59)),
        status: isError ? "error" : "success",
        tasksProcessed,
        durationMs,
        message: isError
          ? "Upstream API timeout — retry scheduled"
          : undefined,
      });
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return runs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function buildAutomationsFromRuns(
  defs: ClientSeedSpec["automationDefs"],
  runs: RunRecord[]
): Automation[] {
  return defs.map((def) => {
    const automationRuns = runs.filter((r) => r.automationId === def.id);
    const successRuns = automationRuns.filter((r) => r.status === "success");
    const recentRuns: AutomationRun[] = automationRuns.slice(0, 5).map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      status: r.status,
      tasksProcessed: r.tasksProcessed,
      durationMs: r.durationMs,
      message: r.message,
    }));

    const tasksThisMonth = automationRuns
      .filter((r) => {
        const d = new Date(r.timestamp);
        const now = new Date();
        return (
          d.getUTCFullYear() === now.getUTCFullYear() &&
          d.getUTCMonth() === now.getUTCMonth()
        );
      })
      .reduce((sum, r) => sum + r.tasksProcessed, 0);

    const successRate =
      automationRuns.length > 0
        ? (successRuns.length / automationRuns.length) * 100
        : 0;

    const lastRun = automationRuns[0]?.timestamp ?? null;
    const lastErrorRun = automationRuns.find((r) => r.status === "error");

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      status: def.status,
      runCount: automationRuns.length,
      successRate: Math.round(successRate * 10) / 10,
      lastRun,
      lastError:
        def.status === "error"
          ? (lastErrorRun?.message ?? "Automation requires attention")
          : null,
      tasksThisMonth,
      recentRuns,
    };
  });
}

function buildTasksByMonth(runs: RunRecord[]): DashboardKpis["tasksByMonth"] {
  const now = new Date();
  const buckets: { key: string; label: string; tasks: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
      label: MONTH_LABELS[d.getUTCMonth()],
      tasks: 0,
    });
  }

  for (const run of runs) {
    const d = new Date(run.timestamp);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.tasks += run.tasksProcessed;
    }
  }

  return buckets.map((b) => ({ month: b.label, tasks: b.tasks }));
}

function buildActivity(
  clientId: string,
  automations: Automation[],
  runs: RunRecord[]
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  let idx = 0;

  for (const run of runs.slice(0, 12)) {
    events.push({
      id: `${clientId}-evt-${++idx}`,
      timestamp: run.timestamp,
      type: run.status === "error" ? "error" : "automation_run",
      message:
        run.status === "error"
          ? `${run.automationName} failed — ${run.message ?? "see dashboard"}`
          : `${run.automationName} completed — ${run.tasksProcessed} tasks processed`,
      automationId: run.automationId,
    });
  }

  events.push({
    id: `${clientId}-evt-${++idx}`,
    timestamp: new Date().toISOString(),
    type: "report_generated",
    message: "Monthly performance report generated",
  });

  const paused = automations.find((a) => a.status === "paused");
  if (paused) {
    events.push({
      id: `${clientId}-evt-${++idx}`,
      timestamp: paused.lastRun ?? new Date().toISOString(),
      type: "settings_updated",
      message: `${paused.name} paused by administrator`,
      automationId: paused.id,
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function buildConfig(spec: ClientSeedSpec): ClientConfig {
  return {
    clientName: spec.clientName,
    email: spec.email,
    plan: spec.plan,
    mrr: spec.mrr,
    active: true,
    escalationEmail: spec.email,
    notificationPreferences: {
      emailReports: true,
      emailErrors: true,
      emailWeeklySummary: spec.plan === "enterprise",
    },
    businessHours: {
      monday: { open: "08:00", close: "17:00" },
      tuesday: { open: "08:00", close: "17:00" },
      wednesday: { open: "08:00", close: "17:00" },
      thursday: { open: "08:00", close: "17:00" },
      friday: { open: "08:00", close: "16:00" },
      saturday: null,
      sunday: null,
    },
    faq: [
      {
        question: `What services does ${spec.clientName} offer?`,
        answer: `Contact ${spec.email} for service details. Our AI assistant can answer common questions during business hours.`,
      },
      {
        question: "How do I reach someone after hours?",
        answer:
          "Leave a message and our automation will route urgent items to the on-call contact.",
      },
    ],
  };
}

async function writeClient(spec: ClientSeedSpec): Promise<void> {
  const clientDir = path.join(DATA_DIR, spec.clientId);
  const runsDir = path.join(clientDir, "runs");
  await fs.mkdir(runsDir, { recursive: true });

  const placeholderAutomations = spec.automationDefs.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    runCount: 0,
    successRate: 0,
    lastRun: null,
    lastError: null,
    tasksThisMonth: 0,
    recentRuns: [] as AutomationRun[],
  }));

  const runs = generateRunsForClient(spec, placeholderAutomations);
  const automations = buildAutomationsFromRuns(spec.automationDefs, runs);
  const aggregated = aggregateKpisFromRuns(runs, automations);
  const kpis: DashboardKpis = {
    ...aggregated,
    tasksByMonth: buildTasksByMonth(runs),
  };
  const activity = buildActivity(spec.clientId, automations, runs);

  const config = buildConfig(spec);

  await fs.writeFile(
    path.join(clientDir, "config.json"),
    JSON.stringify(config, null, 2)
  );
  await fs.writeFile(
    path.join(clientDir, "automations.json"),
    JSON.stringify(automations, null, 2)
  );
  await fs.writeFile(
    path.join(clientDir, "kpis.json"),
    JSON.stringify(kpis, null, 2)
  );
  await fs.writeFile(
    path.join(clientDir, "activity.json"),
    JSON.stringify(activity, null, 2)
  );
  await fs.writeFile(
    path.join(clientDir, "reports.json"),
    JSON.stringify([], null, 2)
  );

  for (const run of runs) {
    await fs.writeFile(
      path.join(runsDir, `${run.id}.json`),
      JSON.stringify(run, null, 2)
    );
  }

  console.log(
    `✓ ${spec.clientId} (${spec.planLabel}): ${automations.length} automations, ${runs.length} runs, ${kpis.tasksAutomated} tasks`
  );
}

async function main(): Promise<void> {
  console.log("Seeding Clinovyr dashboard test clients…\n");

  for (const spec of CLIENTS) {
    await writeClient(spec);
  }

  console.log("\nDone. Client IDs:");
  for (const spec of CLIENTS) {
    console.log(`  - ${spec.clientId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
