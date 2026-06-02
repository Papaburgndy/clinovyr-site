/**
 * Server-side only — do not import from client components.
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { Resend } from "resend";
import {
  getAutomations,
  getClientConfig,
  saveReportMeta,
} from "./clients";
import { renderMonthlyReportPdfToBuffer } from "./monthly-report-pdf";
import type {
  Automation,
  MonthlyReportMetrics,
  MonthlyReportNarrative,
  ReportMeta,
  RunRecord,
} from "./types";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_PARSE_ATTEMPTS = 3;
const JSON_RETRY_SUFFIX =
  "\n\nReturn ONLY a valid JSON object, no markdown, no preamble.";

const DATA_DIR = path.join(process.cwd(), "data", "clients");

export type MonthlyReportResult = {
  pdfPath: string;
  metrics: MonthlyReportMetrics;
  narrative: MonthlyReportNarrative;
  emailSent: boolean;
};

function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

function isInMonth(timestamp: string, month: number, year: number): boolean {
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
}

async function loadRunRecords(clientId: string): Promise<RunRecord[]> {
  const clientPath = path.join(DATA_DIR, clientId);
  const runsDir = path.join(clientPath, "runs");

  try {
    const entries = await fs.readdir(runsDir);
    const jsonFiles = entries.filter((file) => file.endsWith(".json"));
    if (jsonFiles.length > 0) {
      const runs = await Promise.all(
        jsonFiles.map(async (file) => {
          const raw = await fs.readFile(path.join(runsDir, file), "utf-8");
          return JSON.parse(raw) as RunRecord;
        })
      );
      return runs;
    }
  } catch {
    // Fall through to runs.json
  }

  try {
    const raw = await fs.readFile(path.join(clientPath, "runs.json"), "utf-8");
    return JSON.parse(raw) as RunRecord[];
  } catch {
    return [];
  }
}

async function ensureSampleRuns(clientId: string): Promise<RunRecord[]> {
  const existing = await loadRunRecords(clientId);
  if (existing.length > 0) {
    return existing;
  }

  const automations = await getAutomations(clientId);
  const runs: RunRecord[] = [];

  for (const automation of automations) {
    for (const run of automation.recentRuns) {
      runs.push({
        id: run.id,
        automationId: automation.id,
        automationName: automation.name,
        timestamp: run.timestamp,
        status: run.status,
        tasksProcessed: run.tasksProcessed,
        durationMs: run.durationMs,
        message: run.message,
      });
    }
  }

  const runsDir = path.join(DATA_DIR, clientId, "runs");
  await fs.mkdir(runsDir, { recursive: true });

  for (const run of runs) {
    await fs.writeFile(
      path.join(runsDir, `${run.id}.json`),
      JSON.stringify(run, null, 2)
    );
  }

  return runs;
}

export function aggregateMonthlyMetrics(
  runs: RunRecord[],
  automations: Automation[],
  month: number,
  year: number
): MonthlyReportMetrics {
  const monthRuns = runs.filter((run) => isInMonth(run.timestamp, month, year));
  const totalRuns = monthRuns.length;
  const successfulRuns = monthRuns.filter((run) => run.status === "success");
  const errorRuns = monthRuns.filter((run) => run.status === "error");
  const totalTasksAutomated = monthRuns.reduce(
    (sum, run) => sum + run.tasksProcessed,
    0
  );
  const successRate =
    totalRuns > 0 ? (successfulRuns.length / totalRuns) * 100 : 0;
  const downtimeMinutes = Math.round(
    errorRuns.reduce((sum, run) => sum + run.durationMs, 0) / 60000
  );

  const runsByAutomation = new Map<string, RunRecord[]>();
  for (const run of monthRuns) {
    const list = runsByAutomation.get(run.automationId) ?? [];
    list.push(run);
    runsByAutomation.set(run.automationId, list);
  }

  const automationPerformance = automations.map((automation) => {
    const automationRuns = runsByAutomation.get(automation.id) ?? [];
    const automationErrors = automationRuns.filter(
      (run) => run.status === "error"
    );
    const automationSuccess = automationRuns.filter(
      (run) => run.status === "success"
    );

    return {
      automationId: automation.id,
      name: automation.name,
      runs: automationRuns.length,
      tasksAutomated: automationRuns.reduce(
        (sum, run) => sum + run.tasksProcessed,
        0
      ),
      successRate:
        automationRuns.length > 0
          ? (automationSuccess.length / automationRuns.length) * 100
          : 0,
      errors: automationErrors.length,
    };
  });

  const mostActive = automationPerformance.reduce(
    (best, row) => (row.runs > best.runs ? row : best),
    { name: "None", runs: 0 } as { name: string; runs: number }
  );

  return {
    month,
    year,
    monthName: monthName(month),
    totalRuns,
    totalTasksAutomated,
    successRate,
    mostActiveAutomation: mostActive.runs > 0 ? mostActive.name : "None",
    errorRuns: errorRuns.length,
    downtimeMinutes,
    automationPerformance,
  };
}

function buildSystemPrompt(): string {
  return `You are a senior AI operations consultant at Clinovyr, an AI consulting firm serving small and mid-size businesses in Placer County, California.

Write narrative sections for a monthly AI automation performance report. Tone: warm, professional, and results-focused — celebrate wins with specific numbers, acknowledge issues honestly, and look forward with concrete recommendations. Not hypey or generic.

Return ONLY valid JSON matching this schema (no markdown, no preamble):
{
  "executiveSummary": "string — exactly 2 paragraphs separated by a blank line",
  "winsThisMonth": ["string", "string", ...],
  "lookingAhead": "string — 1 paragraph"
}

Requirements:
- executiveSummary: 2 paragraphs referencing the client's metrics by name
- winsThisMonth: 4–6 bullet strings with specific numbers where possible
- lookingAhead: 1 paragraph with actionable next-month priorities`;
}

function buildUserPrompt(
  clientName: string,
  metrics: MonthlyReportMetrics,
  automations: Automation[]
): string {
  return `Client: ${clientName}
Report period: ${metrics.monthName} ${metrics.year}

Metrics:
- Total automation runs: ${metrics.totalRuns}
- Total tasks automated: ${metrics.totalTasksAutomated}
- Overall success rate: ${metrics.successRate.toFixed(1)}%
- Most active automation: ${metrics.mostActiveAutomation}
- Error runs: ${metrics.errorRuns}
- Estimated downtime: ${metrics.downtimeMinutes} minutes

Automation performance:
${metrics.automationPerformance
  .map(
    (row) =>
      `- ${row.name}: ${row.runs} runs, ${row.tasksAutomated} tasks, ${row.successRate.toFixed(1)}% success, ${row.errors} errors`
  )
  .join("\n")}

Automation statuses:
${automations
  .map(
    (automation) =>
      `- ${automation.name}: ${automation.status}${automation.lastError ? ` (${automation.lastError})` : ""}`
  )
  .join("\n")}`;
}

function buildFallbackNarrative(
  clientName: string,
  metrics: MonthlyReportMetrics
): MonthlyReportNarrative {
  const topPerformer = metrics.automationPerformance.reduce((best, row) =>
    row.tasksAutomated > best.tasksAutomated ? row : best
  );

  return {
    executiveSummary: `${clientName} completed ${metrics.monthName} ${metrics.year} with ${metrics.totalRuns} automation runs processing ${metrics.totalTasksAutomated.toLocaleString()} tasks at a ${metrics.successRate.toFixed(1)}% success rate. ${metrics.mostActiveAutomation} led activity this month, keeping routine work off your team's plate.\n\n${
      metrics.errorRuns > 0
        ? `${metrics.errorRuns} run(s) encountered errors, accounting for roughly ${metrics.downtimeMinutes} minutes of downtime. Addressing those items early will protect momentum going into next month.`
        : "All monitored automations completed the month without recorded errors — a strong signal that your workflows are stable and delivering consistent value."
    }`,
    winsThisMonth: [
      `${metrics.totalTasksAutomated.toLocaleString()} tasks automated across ${metrics.totalRuns} runs`,
      `${metrics.successRate.toFixed(1)}% overall success rate for ${metrics.monthName}`,
      `${topPerformer.name} processed ${topPerformer.tasksAutomated} tasks`,
      `${metrics.mostActiveAutomation} was your most active automation`,
      metrics.errorRuns === 0
        ? "Zero error runs recorded this month"
        : `${metrics.errorRuns} error run(s) flagged for review`,
    ],
    lookingAhead: `Prioritize any automations with errors or paused status, refresh credentials where needed, and align with Clinovyr on one high-impact workflow to optimize in the coming month.`,
  };
}

function parseNarrativeJson(raw: string): MonthlyReportNarrative {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Claude response did not contain JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as MonthlyReportNarrative;

  if (
    typeof parsed.executiveSummary !== "string" ||
    !Array.isArray(parsed.winsThisMonth) ||
    typeof parsed.lookingAhead !== "string"
  ) {
    throw new Error("Claude JSON missing required narrative fields.");
  }

  return parsed;
}

async function generateNarrative(
  clientName: string,
  metrics: MonthlyReportMetrics,
  automations: Automation[]
): Promise<MonthlyReportNarrative> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return buildFallbackNarrative(clientName, metrics);
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(clientName, metrics, automations);
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PARSE_ATTEMPTS; attempt++) {
    const prompt =
      attempt === 1 ? userPrompt : `${userPrompt}${JSON_RETRY_SUFFIX}`;

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        lastError = new Error("Claude returned an empty response.");
        continue;
      }

      return parseNarrativeJson(textBlock.text);
    } catch (error) {
      lastError = error;
    }
  }

  console.warn(
    "[monthly-report] Claude narrative failed, using fallback:",
    lastError
  );
  return buildFallbackNarrative(clientName, metrics);
}

async function sendReportEmail(
  to: string,
  clientName: string,
  metrics: MonthlyReportMetrics,
  narrative: MonthlyReportNarrative,
  pdfBuffer: Buffer,
  filename: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return false;
  }

  const from =
    process.env.RESEND_SANDBOX === "true" || !process.env.EMAIL_FROM
      ? "Clinovyr Dashboard <onboarding@resend.dev>"
      : process.env.EMAIL_FROM;
  const highlights = narrative.winsThisMonth.slice(0, 3);
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Your ${metrics.monthName} AI Performance Report is ready`,
      html: `
        <p>Hi ${clientName} team,</p>
        <p>Your ${metrics.monthName} ${metrics.year} AI performance report is attached.</p>
        <p><strong>Top highlights:</strong></p>
        <ul>
          ${highlights.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p>Questions? Reply to this email or contact us at clinovyr@gmail.com.</p>
        <p>— Clinovyr<br/>Intelligence, Applied.</p>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[monthly-report] Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[monthly-report] Email send failed:", error);
    return false;
  }
}

export type GenerateMonthlyReportOptions = {
  /** Log metrics only; skip PDF write and email. */
  dryRun?: boolean;
};

export async function generateMonthlyReport(
  clientId: string,
  month: number,
  year: number,
  options?: GenerateMonthlyReportOptions
): Promise<MonthlyReportResult> {
  if (month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12.");
  }

  const [config, automations] = await Promise.all([
    getClientConfig(clientId),
    getAutomations(clientId),
  ]);

  const runs = await ensureSampleRuns(clientId);
  const metrics = aggregateMonthlyMetrics(runs, automations, month, year);
  const narrative = await generateNarrative(
    config.clientName,
    metrics,
    automations
  );

  const pdfBuffer = await renderMonthlyReportPdfToBuffer({
    clientName: config.clientName,
    metrics,
    narrative,
    monthRuns: runs,
  });

  const filename = `${year}-${String(month).padStart(2, "0")}.pdf`;
  const reportsDir = path.join(DATA_DIR, clientId, "reports");
  const pdfPath = path.join(reportsDir, filename);

  if (options?.dryRun) {
    console.log(
      `[monthly-report] dry-run ${clientId} ${metrics.monthName} ${year}: runs=${metrics.totalRuns} tasks=${metrics.totalTasksAutomated} success=${metrics.successRate.toFixed(1)}%`
    );
    return {
      pdfPath,
      metrics,
      narrative,
      emailSent: false,
    };
  }

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(pdfPath, pdfBuffer);

  const reportMeta: ReportMeta = {
    id: `report-${year}-${String(month).padStart(2, "0")}`,
    month: metrics.monthName,
    year,
    filename,
    generatedAt: new Date().toISOString(),
    sizeKb: Math.max(1, Math.round(pdfBuffer.length / 1024)),
  };
  await saveReportMeta(clientId, reportMeta);

  const wantsEmail = config.notificationPreferences?.emailReports !== false;
  const emailSent =
    wantsEmail &&
    (await sendReportEmail(
      config.email,
      config.clientName,
      metrics,
      narrative,
      pdfBuffer,
      filename
    ));

  return {
    pdfPath,
    metrics,
    narrative,
    emailSent,
  };
}

export function getPreviousMonthReference(date = new Date()): {
  month: number;
  year: number;
} {
  const month = date.getMonth();
  const year = date.getFullYear();

  if (month === 0) {
    return { month: 12, year: year - 1 };
  }

  return { month, year };
}
