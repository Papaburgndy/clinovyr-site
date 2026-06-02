import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, type ChildProcess } from 'child_process';

const QA_ROOT = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.resolve(QA_ROOT, '../dashboard');
const CLIENTS_DIR = path.join(DASHBOARD_DIR, 'data/clients');
const ENV_PATH = path.resolve(QA_ROOT, '../../.env.local');
const DASHBOARD_ENV_PATH = path.join(DASHBOARD_DIR, '.env.local');

/** Default dashboard dev port (see clinovyr-products/health-check.ts). */
const DEFAULT_DASHBOARD_PORT = 3002;

const QA_CLIENT_ID = 'qa-granite-bay-dental';
const PRODUCTION_SEED_CLIENT_ID = 'granite-bay-dental';
const QA_EMAIL = 'clinovyr@gmail.com';

const KNOWN_RUNS = 50;
const KNOWN_TASKS = 500;
const KNOWN_ERRORS = 3;
const TASKS_PER_RUN = KNOWN_TASKS / KNOWN_RUNS;

/** Matches dashboard/src/lib/kpi-aggregation.ts */
const MINUTES_SAVED_PER_TASK = 8.67;
const STAFF_HOURLY_RATE_USD = 45;

const REPORT_MONTH = 5;
const REPORT_YEAR = 2026;
const REPORT_FILENAME = `${REPORT_YEAR}-${String(REPORT_MONTH).padStart(2, '0')}.pdf`;

function computeHoursSaved(tasksAutomated: number): number {
  return Math.round((tasksAutomated * MINUTES_SAVED_PER_TASK) / 60);
}

function computeRoiEstimate(hoursSaved: number): number {
  return Math.round(hoursSaved * STAFF_HOURLY_RATE_USD);
}

function computeSuccessRate(successfulRuns: number, totalRuns: number): number {
  return totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
}

function loadEnvFiles(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    for (const envFile of [ENV_PATH, DASHBOARD_ENV_PATH]) {
      if (!fs.existsSync(envFile)) continue;
      const parsed = dotenv.parse(fs.readFileSync(envFile));
      for (const [key, value] of Object.entries(parsed)) {
        if (value) process.env[key] = value;
      }
    }
  } catch {
    // rely on existing process.env
  }
}

function resolveDashboardPort(base: string): number {
  const fromEnv = process.env.DASHBOARD_PORT?.trim();
  if (fromEnv) return Number(fromEnv);
  try {
    const u = new URL(base);
    if (u.port) return Number(u.port);
  } catch {
    // ignore
  }
  return DEFAULT_DASHBOARD_PORT;
}

function resolveDashboardBase(): string {
  const explicit =
    process.env.DASHBOARD_BASE?.trim() || process.env.DASHBOARD_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const port = Number(process.env.DASHBOARD_PORT ?? DEFAULT_DASHBOARD_PORT);
  return `http://localhost:${port}`;
}

function getDashboardDevEnv(): NodeJS.ProcessEnv {
  const base = resolveDashboardBase();
  const port = resolveDashboardPort(base);
  return {
    ...process.env,
    PORT: String(port),
    ENABLE_TEST_AUTH: 'true',
    AUTH_SECRET:
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      'playwright-test-secret-min-32-chars-long',
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ??
      process.env.AUTH_SECRET ??
      'playwright-test-secret-min-32-chars-long',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? base,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? QA_EMAIL,
    CRON_SECRET:
      process.env.CRON_SECRET ?? 'qa-cron-secret-min-32-characters-long',
  };
}

function killProcessOnPort(port: number): void {
  try {
    const { spawnSync } = require('child_process') as typeof import('child_process');
    const found = spawnSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' });
    const pids = found.stdout
      .trim()
      .split('\n')
      .map((pid) => pid.trim())
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

function ensureDashboardEnvSymlink(): void {
  if (fs.existsSync(DASHBOARD_ENV_PATH)) return;
  if (!fs.existsSync(ENV_PATH)) return;
  try {
    fs.symlinkSync(path.relative(DASHBOARD_DIR, ENV_PATH), DASHBOARD_ENV_PATH);
  } catch {
    // ignore — dev server may still inherit env from parent
  }
}

async function seedQaClient(): Promise<string> {
  const clientDir = path.join(CLIENTS_DIR, QA_CLIENT_ID);
  const runsDir = path.join(clientDir, 'runs');
  const reportsDir = path.join(clientDir, 'reports');

  await fs.promises.rm(clientDir, { recursive: true, force: true });
  await fs.promises.mkdir(runsDir, { recursive: true });
  await fs.promises.mkdir(reportsDir, { recursive: true });

  const automationId = 'qa-auto-intake';
  const automations = [
    {
      id: automationId,
      name: 'QA Patient Intake',
      description: 'QA fixture automation for dashboard KPI and report tests.',
      status: 'running' as const,
      runCount: KNOWN_RUNS,
      successRate: computeSuccessRate(KNOWN_RUNS - KNOWN_ERRORS, KNOWN_RUNS),
      lastRun: `${REPORT_YEAR}-05-31T17:00:00Z`,
      lastError: KNOWN_ERRORS > 0 ? 'Simulated error for QA' : null,
      tasksThisMonth: KNOWN_TASKS,
      recentRuns: [] as Array<{
        id: string;
        timestamp: string;
        status: 'success' | 'error';
        tasksProcessed: number;
        durationMs: number;
      }>,
    },
  ];

  const runs: Array<{
    id: string;
    automationId: string;
    automationName: string;
    timestamp: string;
    status: 'success' | 'error';
    tasksProcessed: number;
    durationMs: number;
  }> = [];

  for (let i = 1; i <= KNOWN_RUNS; i++) {
    const isError = i <= KNOWN_ERRORS;
    const day = String(Math.min(28, 1 + (i % 28))).padStart(2, '0');
    const hour = String(8 + (i % 10)).padStart(2, '0');
    const run = {
      id: `qa-run-${i}`,
      automationId,
      automationName: 'QA Patient Intake',
      timestamp: `${REPORT_YEAR}-05-${day}T${hour}:30:00Z`,
      status: isError ? ('error' as const) : ('success' as const),
      tasksProcessed: TASKS_PER_RUN,
      durationMs: isError ? 120_000 : 3_000,
    };
    runs.push(run);
    automations[0].recentRuns.push({
      id: run.id,
      timestamp: run.timestamp,
      status: run.status,
      tasksProcessed: run.tasksProcessed,
      durationMs: run.durationMs,
    });
    await fs.promises.writeFile(
      path.join(runsDir, `${run.id}.json`),
      JSON.stringify(run, null, 2),
    );
  }

  const hoursSaved = computeHoursSaved(KNOWN_TASKS);
  const kpis = {
    tasksAutomated: KNOWN_TASKS,
    hoursSaved,
    automationsRunning: 1,
    roiEstimate: computeRoiEstimate(hoursSaved),
    tasksByMonth: [{ month: 'May', tasks: KNOWN_TASKS }],
  };

  const config = {
    clientName: 'QA Granite Bay Dental',
    email: QA_EMAIL,
    plan: 'starter' as const,
    mrr: 999,
    active: true,
    escalationEmail: QA_EMAIL,
    notificationPreferences: {
      emailReports: false,
      emailErrors: false,
      emailWeeklySummary: false,
    },
    businessHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '16:00' },
      saturday: null,
      sunday: null,
    },
    faq: [],
  };

  await fs.promises.writeFile(
    path.join(clientDir, 'config.json'),
    JSON.stringify(config, null, 2),
  );
  await fs.promises.writeFile(
    path.join(clientDir, 'automations.json'),
    JSON.stringify(automations, null, 2),
  );
  await fs.promises.writeFile(
    path.join(clientDir, 'kpis.json'),
    JSON.stringify(kpis, null, 2),
  );
  await fs.promises.writeFile(path.join(clientDir, 'activity.json'), '[]');
  await fs.promises.writeFile(path.join(clientDir, 'reports.json'), '[]');

  return path.join(reportsDir, REPORT_FILENAME);
}

async function buildSessionCookie(baseUrl: string): Promise<string> {
  const devEnv = getDashboardDevEnv();
  const authSecret = String(
    devEnv.AUTH_SECRET ?? 'playwright-test-secret-min-32-chars-long',
  );
  const adminEmail = String(devEnv.ADMIN_EMAIL ?? '')
    .trim()
    .toLowerCase();
  const useAdmin =
    adminEmail.length > 0 && adminEmail === QA_EMAIL.toLowerCase();

  const jwtModulePath = path.join(
    DASHBOARD_DIR,
    'node_modules/next-auth/jwt',
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { encode } = require(jwtModulePath) as {
    encode: (options: {
      token: Record<string, unknown>;
      secret: string;
      salt: string;
    }) => Promise<string>;
  };

  const token = await encode({
    token: useAdmin
      ? {
          email: QA_EMAIL,
          isAdmin: true,
          sub: QA_EMAIL,
        }
      : {
          email: QA_EMAIL,
          isAdmin: false,
          clientId: QA_CLIENT_ID,
          sub: QA_EMAIL,
        },
    secret: authSecret,
    salt: 'authjs.session-token',
  });

  return `authjs.session-token=${token}`;
}

async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const res = await fetch(url, init);
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  return { ok: res.ok, status: res.status, body };
}

async function probeDashboardHealth(
  base: string,
): Promise<{ reachable: boolean; ok: boolean; status: string; http: number }> {
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    let status = 'unknown';
    try {
      const data = (await res.json()) as { status?: string };
      status = data.status ?? 'unknown';
    } catch {
      status = 'invalid-json';
    }
    return {
      reachable: true,
      ok: res.ok && (status === 'ok' || status === 'degraded'),
      status,
      http: res.status,
    };
  } catch {
    return { reachable: false, ok: false, status: 'unreachable', http: 0 };
  }
}

let devChild: ChildProcess | null = null;

function startDashboardDev(): void {
  ensureDashboardEnvSymlink();
  const base = resolveDashboardBase();
  const port = resolveDashboardPort(base);
  devChild = spawn(
    'npm',
    ['run', 'dev', '--', '-p', String(port)],
    {
      cwd: DASHBOARD_DIR,
      env: getDashboardDevEnv(),
      stdio: 'pipe',
      detached: process.platform !== 'win32',
    },
  );
  devChild.unref?.();
}

async function ensureDashboardRunning(base: string): Promise<boolean> {
  let health = await probeDashboardHealth(base);
  if (health.ok) return true;

  if (health.reachable && !health.ok) {
    console.log(
      `Dashboard on ${base} returned health=${health.status} (HTTP ${health.http}) — restarting with QA env…`,
    );
    killProcessOnPort(resolveDashboardPort(base));
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    console.log(
      `Dashboard not reachable at ${base} — starting dev server on port ${resolveDashboardPort(base)}…`,
    );
  }

  startDashboardDev();

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    health = await probeDashboardHealth(base);
    if (health.ok) return true;
  }
  return false;
}

export async function runPhase5(harness: QAHarness): Promise<void> {
  loadEnvFiles();
  const dashboardBase = resolveDashboardBase();
  const expectedPdfPath = await seedQaClient();
  const expectedHoursSaved = computeHoursSaved(KNOWN_TASKS);
  const expectedSuccessRate = computeSuccessRate(
    KNOWN_RUNS - KNOWN_ERRORS,
    KNOWN_RUNS,
  );

  console.log('\n\x1b[33m── PHASE 5: CLIENT DASHBOARD ──\x1b[0m');
  console.log(
    `Dashboard base: ${dashboardBase} | clientId=${QA_CLIENT_ID} | port ${DEFAULT_DASHBOARD_PORT} (health-check.ts)`,
  );
  console.log(
    `Routes: GET /api/dashboard/kpis?clientId= | POST /api/dashboard/report/generate`,
  );
  console.log(
    `Note: KPI JSON uses tasksAutomated/hoursSaved (no successRate); successRate is in report metrics.`,
  );

  const prodSeedPath = path.join(CLIENTS_DIR, PRODUCTION_SEED_CLIENT_ID, 'config.json');
  harness.record({
    id: 'DASH-SEED-PROD',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: `Production seed client (${PRODUCTION_SEED_CLIENT_ID}) untouched`,
    status: fs.existsSync(prodSeedPath) ? 'PASS' : 'WARN',
    message: fs.existsSync(prodSeedPath)
      ? `Using isolated QA client ${QA_CLIENT_ID}; ${PRODUCTION_SEED_CLIENT_ID} remains separate`
      : `${PRODUCTION_SEED_CLIENT_ID} not present — QA uses ${QA_CLIENT_ID} only`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  harness.record({
    id: 'DASH-SEED',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: `Seed ${QA_CLIENT_ID}`,
    status: 'PASS',
    message: `${KNOWN_RUNS} runs, ${KNOWN_TASKS} tasks, ${KNOWN_ERRORS} errors, email=${QA_EMAIL}`,
    deliverable: path.join(CLIENTS_DIR, QA_CLIENT_ID),
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  const running = await ensureDashboardRunning(dashboardBase);
  if (!running) {
    harness.record({
      id: 'DASH-UP',
      product: 'Client Dashboard',
      phase: 'Tier A',
      testName: 'Dashboard server reachable',
      status: 'FAIL',
      message: `Could not reach ${dashboardBase}/api/health after starting dev server`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  harness.record({
    id: 'DASH-UP',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: 'Dashboard server reachable',
    status: 'PASS',
    message: `Health OK at ${dashboardBase}/api/health`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  const cookie = await buildSessionCookie(dashboardBase);
  const authHeaders = {
    Cookie: cookie,
    Accept: 'application/json',
  };

  const kpiStart = Date.now();
  const kpiUrl = `${dashboardBase}/api/dashboard/kpis?clientId=${encodeURIComponent(QA_CLIENT_ID)}`;
  const kpiRes = await fetchJson(kpiUrl, { headers: authHeaders });

  const tasksAutomated = Number(kpiRes.body.tasksAutomated);
  const hoursSaved = Number(kpiRes.body.hoursSaved);
  const kpiOk =
    kpiRes.ok &&
    kpiRes.status === 200 &&
    tasksAutomated === KNOWN_TASKS &&
    hoursSaved === expectedHoursSaved &&
    kpiRes.body.successRate === undefined;

  harness.record({
    id: 'DASH-KPI',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: 'GET /api/dashboard/kpis?clientId=',
    status: kpiOk ? 'PASS' : 'FAIL',
    message: kpiOk
      ? `tasksAutomated=${tasksAutomated}, hoursSaved=${hoursSaved} (expected ${KNOWN_TASKS}/${expectedHoursSaved})`
      : [
          `http=${kpiRes.status}`,
          `tasksAutomated=${tasksAutomated} (expected ${KNOWN_TASKS})`,
          `hoursSaved=${hoursSaved} (expected ${expectedHoursSaved})`,
          kpiRes.body.error ? `error=${String(kpiRes.body.error)}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
    duration: Date.now() - kpiStart,
    timestamp: new Date().toISOString(),
  });

  const reportStart = Date.now();
  const reportRes = await fetchJson(
    `${dashboardBase}/api/dashboard/report/generate`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: QA_CLIENT_ID,
        month: REPORT_MONTH,
        year: REPORT_YEAR,
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );

  const metrics =
    reportRes.body.metrics && typeof reportRes.body.metrics === 'object'
      ? (reportRes.body.metrics as Record<string, unknown>)
      : {};
  const reportSuccessRate = Number(metrics.successRate);
  const reportTasks = Number(metrics.totalTasksAutomated);
  const reportRuns = Number(metrics.totalRuns);
  const reportErrors = Number(metrics.errorRuns);

  const pdfPathFromApi =
    typeof reportRes.body.pdfPath === 'string'
      ? reportRes.body.pdfPath
      : expectedPdfPath;
  const pdfExists = fs.existsSync(pdfPathFromApi);
  const pdfSize = pdfExists ? fs.statSync(pdfPathFromApi).size : 0;

  const reportOk =
    reportRes.ok &&
    reportRes.status === 200 &&
    reportRuns === KNOWN_RUNS &&
    reportTasks === KNOWN_TASKS &&
    reportErrors === KNOWN_ERRORS &&
    Math.abs(reportSuccessRate - expectedSuccessRate) < 0.01 &&
    pdfExists &&
    pdfSize > 1024;

  harness.record({
    id: 'DASH-REPORT',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: 'POST /api/dashboard/report/generate',
    status: reportOk ? 'PASS' : 'FAIL',
    message: reportOk
      ? `successRate=${reportSuccessRate.toFixed(1)}%, tasks=${reportTasks}, errors=${reportErrors}, PDF ${Math.round(pdfSize / 1024)}KB`
      : [
          `http=${reportRes.status}`,
          `runs=${reportRuns}/${KNOWN_RUNS}`,
          `tasks=${reportTasks}/${KNOWN_TASKS}`,
          `errors=${reportErrors}/${KNOWN_ERRORS}`,
          `successRate=${reportSuccessRate.toFixed(1)}% (expected ${expectedSuccessRate.toFixed(1)}%)`,
          pdfExists ? `pdf=${pdfSize}B` : `pdf missing at ${expectedPdfPath}`,
          reportRes.body.error ? `error=${String(reportRes.body.error)}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
    deliverable: pdfExists ? pdfPathFromApi : expectedPdfPath,
    deliverableSize: pdfSize,
    duration: Date.now() - reportStart,
    timestamp: new Date().toISOString(),
  });

  const relativePdf = path.relative(DASHBOARD_DIR, pdfPathFromApi);
  harness.record({
    id: 'DASH-PDF-PATH',
    product: 'Client Dashboard',
    phase: 'Tier A',
    testName: 'PDF saved under data/clients/{id}/reports/',
    status:
      pdfExists && relativePdf === `data/clients/${QA_CLIENT_ID}/reports/${REPORT_FILENAME}`
        ? 'PASS'
        : pdfExists
          ? 'WARN'
          : 'FAIL',
    message: pdfExists
      ? `${relativePdf} (${Math.round(pdfSize / 1024)}KB)`
      : `Expected data/clients/${QA_CLIENT_ID}/reports/${REPORT_FILENAME}`,
    deliverable: pdfExists ? pdfPathFromApi : undefined,
    deliverableSize: pdfSize,
    duration: 0,
    timestamp: new Date().toISOString(),
  });
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase5(harness)
    .then(() => {
      const s = harness.summary();
      const verdict = s.fail === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(
        `\nPhase 5: ${verdict} — Pass ${s.pass} | Fail ${s.fail} | Warn ${s.warn} | ${s.elapsed}s`,
      );
      process.exit(s.fail === 0 ? 0 : 1);
    })
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
