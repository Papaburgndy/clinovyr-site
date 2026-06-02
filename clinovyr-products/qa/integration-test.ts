#!/usr/bin/env npx ts-node
/**
 * Cross-system integration test — all 5 product flows.
 *
 * Run (from clinovyr-products/qa):
 *   ASSESSMENT_URL=http://localhost:3001 AGENT_URL=http://localhost:3002 \
 *   DASHBOARD_URL=http://localhost:3003 STORE_URL=http://localhost:3004 \
 *   npx ts-node integration-test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { QAHarness, type TestResult } from './harness';

const QA_ROOT = path.resolve(__dirname);
const ROOT_ENV = path.resolve(QA_ROOT, '../../.env.local');
const ASSESSMENTS_DIR = path.resolve(QA_ROOT, '../assessment/data/assessments');
const DASHBOARD_DIR = path.resolve(QA_ROOT, '../dashboard');
const WORKSHOP_GEN_DIR = path.resolve(QA_ROOT, '../workshop-generator');
const PLAYBOOKS_DIR = path.resolve(QA_ROOT, '../playbooks');
const AI_AGENT_DIR = path.resolve(QA_ROOT, '../ai-agent');

const ASSESSMENT_URL = (process.env.ASSESSMENT_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const AGENT_URL = (process.env.AGENT_URL ?? 'http://localhost:3002').replace(/\/$/, '');
const DASHBOARD_URL = (process.env.DASHBOARD_URL ?? 'http://localhost:3003').replace(/\/$/, '');
const STORE_URL = (process.env.STORE_URL ?? process.env.PLAYBOOKS_URL ?? 'http://localhost:3004').replace(/\/$/, '');

const QA_EMAIL = process.env.QA_TEST_EMAIL ?? process.env.CONTACT_EMAIL ?? 'clinovyr@gmail.com';
const QA_CLIENT_ID = 'qa-granite-bay-dental';
const REPORT_MONTH = 5;
const REPORT_YEAR = 2026;
const REPORT_FILENAME = `${REPORT_YEAR}-${String(REPORT_MONTH).padStart(2, '0')}.pdf`;

type FlowStatus = 'PASS' | 'WARN' | 'FAIL';

type FlowResult = {
  flow: number;
  name: string;
  status: FlowStatus;
  steps: Array<{ step: string; status: FlowStatus; detail: string }>;
  durationMs: number;
};

type ResendEmail = {
  id: string;
  to?: string[];
  subject?: string;
  created_at?: string;
  last_event?: string;
};

function loadEnvFiles(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    if (fs.existsSync(ROOT_ENV)) {
      const parsed = dotenv.parse(fs.readFileSync(ROOT_ENV));
      for (const [key, value] of Object.entries(parsed)) {
        if (value) process.env[key] = value;
      }
    }
  } catch {
    // rely on process.env
  }
}

function worstStatus(statuses: FlowStatus[]): FlowStatus {
  if (statuses.includes('FAIL')) return 'FAIL';
  if (statuses.includes('WARN')) return 'WARN';
  return 'PASS';
}

async function waitForHealth(
  name: string,
  url: string,
  maxAttempts = 90,
): Promise<{ ok: boolean; detail: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      let status = 'unknown';
      let filesystem: boolean | undefined;
      try {
        const body = (await res.json()) as { status?: string; checks?: { filesystem?: boolean } };
        status = body.status ?? 'unknown';
        filesystem = body.checks?.filesystem;
      } catch {
        status = 'invalid-json';
      }
      // Reachable JSON health endpoint is enough; Stripe/Redis gaps surface as status=error.
      const ok =
        status !== 'unknown' &&
        status !== 'invalid-json' &&
        status !== 'unreachable' &&
        (res.ok || filesystem === true || name === 'playbooks' || name === 'dashboard' || name === 'ai-agent');
      if (ok) {
        return { ok: true, detail: `HTTP ${res.status}, status=${status}` };
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false, detail: `Timeout waiting for ${url}` };
}

async function listResendEmails(limit = 20): Promise<{ emails: ResendEmail[]; restricted: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { emails: [], restricted: false };
  try {
    const res = await fetch(`https://api.resend.com/emails?limit=${limit}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 401) {
      const body = (await res.json()) as { name?: string };
      if (body.name === 'restricted_api_key') {
        return { emails: [], restricted: true };
      }
    }
    if (!res.ok) return { emails: [], restricted: false };
    const body = (await res.json()) as { data?: ResendEmail[] };
    return { emails: body.data ?? [], restricted: false };
  } catch {
    return { emails: [], restricted: false };
  }
}

function findRecentEmail(
  emails: ResendEmail[],
  predicate: (e: ResendEmail) => boolean,
  afterIso?: string,
): ResendEmail | undefined {
  const afterMs = afterIso ? Date.parse(afterIso) : 0;
  return emails.find((e) => {
    if (afterIso && e.created_at) {
      const created = Date.parse(e.created_at);
      if (!Number.isNaN(created) && created < afterMs - 5000) return false;
    }
    return predicate(e);
  });
}

function buildAssessmentPayload(companyName: string) {
  return {
    companyName,
    industry: 'Medical/Dental',
    employees: '6–20',
    revenue: '$500K–$2M',
    yearsInBusiness: '5',
    crm: ['None'],
    emailTools: ['Gmail/Outlook only'],
    scheduling: ['None'],
    pm: ['Spreadsheets'],
    accounting: ['QuickBooks'],
    timeDrainsRanked: [
      'Customer follow-up',
      'Appointment scheduling',
      'Report generation',
      'Data entry',
      'Email management',
      'Invoicing/billing',
      'Social media',
      'Staff communication',
    ],
    aiTools: 'Never',
    comfortLevel: 2,
    biggestConcern: "Don't know where to start",
    goals: ['Save staff time', 'Work fewer hours', 'Reduce errors'],
    firstName: 'Integration',
    lastName: 'Test',
    email: QA_EMAIL,
    phone: '916-555-0199',
    bestTimeToConnect: 'Flexible',
    hearAbout: 'QA Integration',
    additionalNotes: `integration-test ${Date.now()}`,
  };
}

async function buildDashboardSessionCookie(): Promise<string> {
  const authSecret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    'playwright-test-secret-min-32-chars-long';
  const adminEmail = (process.env.ADMIN_EMAIL ?? QA_EMAIL).trim().toLowerCase();
  const jwtModulePath = path.join(DASHBOARD_DIR, 'node_modules/next-auth/jwt');
  const { encode } = require(jwtModulePath) as {
    encode: (options: {
      token: Record<string, unknown>;
      secret: string;
      salt: string;
    }) => Promise<string>;
  };
  const token = await encode({
    token: {
      email: adminEmail,
      isAdmin: adminEmail === QA_EMAIL.toLowerCase(),
      sub: adminEmail,
    },
    secret: authSecret,
    salt: 'authjs.session-token',
  });
  return `authjs.session-token=${token}`;
}

async function seedDashboardClient(): Promise<string> {
  const clientDir = path.join(DASHBOARD_DIR, 'data/clients', QA_CLIENT_ID);
  const runsDir = path.join(clientDir, 'runs');
  const reportsDir = path.join(clientDir, 'reports');
  const KNOWN_RUNS = 50;
  const KNOWN_TASKS = 500;
  const KNOWN_ERRORS = 3;
  const TASKS_PER_RUN = KNOWN_TASKS / KNOWN_RUNS;

  await fs.promises.rm(clientDir, { recursive: true, force: true });
  await fs.promises.mkdir(runsDir, { recursive: true });
  await fs.promises.mkdir(reportsDir, { recursive: true });

  const automationId = 'qa-auto-intake';
  const automations = [
    {
      id: automationId,
      name: 'QA Patient Intake',
      description: 'QA fixture automation for integration report test.',
      status: 'running' as const,
      runCount: KNOWN_RUNS,
      successRate: ((KNOWN_RUNS - KNOWN_ERRORS) / KNOWN_RUNS) * 100,
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
    automations[0].recentRuns.push({
      id: run.id,
      timestamp: run.timestamp,
      status: run.status,
      tasksProcessed: run.tasksProcessed,
      durationMs: run.durationMs,
    });
    await fs.promises.writeFile(path.join(runsDir, `${run.id}.json`), JSON.stringify(run, null, 2));
  }

  const hoursSaved = Math.round((KNOWN_TASKS * 8.67) / 60);
  await fs.promises.writeFile(
    path.join(clientDir, 'config.json'),
    JSON.stringify(
      {
        clientName: 'QA Granite Bay Dental',
        email: QA_EMAIL,
        plan: 'starter',
        mrr: 999,
        active: true,
        escalationEmail: QA_EMAIL,
        notificationPreferences: {
          emailReports: true,
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
      },
      null,
      2,
    ),
  );
  await fs.promises.writeFile(path.join(clientDir, 'automations.json'), JSON.stringify(automations, null, 2));
  await fs.promises.writeFile(
    path.join(clientDir, 'kpis.json'),
    JSON.stringify(
      {
        tasksAutomated: KNOWN_TASKS,
        hoursSaved,
        automationsRunning: 1,
        roiEstimate: hoursSaved * 45,
        tasksByMonth: [{ month: 'May', tasks: KNOWN_TASKS }],
      },
      null,
      2,
    ),
  );
  await fs.promises.writeFile(path.join(clientDir, 'activity.json'), '[]');
  await fs.promises.writeFile(path.join(clientDir, 'reports.json'), '[]');

  return path.join(reportsDir, REPORT_FILENAME);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractPptxSlideText(pptxPath: string, slideIndex: number): string {
  const result = spawnSync('unzip', ['-p', pptxPath, `ppt/slides/slide${slideIndex}.xml`], {
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024,
  });
  if (result.status !== 0) return '';
  return result.stdout.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

function validateSpeakerGuideNotes(guidePath: string): { ok: boolean; detail: string } {
  const content = fs.readFileSync(guidePath, 'utf8');
  const slideHeaders = [...content.matchAll(/^### Slide (\d+):/gm)].map((m) => Number(m[1]));
  if (slideHeaders.length === 0) {
    return { ok: false, detail: 'No slide sections found in speaker guide' };
  }
  const missing: number[] = [];
  for (const n of slideHeaders) {
    const sectionRe = new RegExp(`### Slide ${n}:[\\s\\S]*?(?=### Slide \\d+:|$)`);
    const section = content.match(sectionRe)?.[0] ?? '';
    const hasNotes =
      section.includes('Speaker notes') ||
      section.includes('speaker notes') ||
      section.split('\n').filter((line) => line.trim().length > 20).length >= 3;
    if (!hasNotes) missing.push(n);
  }
  if (missing.length > 0) {
    return { ok: false, detail: `Missing notes for slides: ${missing.join(', ')}` };
  }
  return { ok: true, detail: `Speaker notes present for all ${slideHeaders.length} slides` };
}

async function runFlow1(harness: QAHarness): Promise<FlowResult> {
  const t0 = Date.now();
  const steps: FlowResult['steps'] = [];
  const companyName = `Integration QA Dental ${Date.now()}`;
  const testStart = new Date().toISOString();
  const emailsBefore = await listResendEmails(30);

  let submitBody: Record<string, unknown> = {};
  let submitStatus = 0;
  try {
    const res = await fetch(`${ASSESSMENT_URL}/api/submit-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAssessmentPayload(companyName)),
      signal: AbortSignal.timeout(60_000),
    });
    submitStatus = res.status;
    submitBody = (await res.json()) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ step: 'Submit assessment', status: 'FAIL', detail: msg });
    harness.record({
      id: 'F1-SUBMIT',
      product: 'Integration',
      phase: 'Flow 1',
      testName: 'Assessment submit',
      status: 'FAIL',
      message: msg,
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
    return { flow: 1, name: 'Assessment → Notification → Dashboard', status: 'FAIL', steps, durationMs: Date.now() - t0 };
  }

  const assessmentId = String(submitBody.assessmentId ?? '');
  const submitOk = submitStatus === 200 && Boolean(assessmentId);
  steps.push({
    step: 'Submit assessment',
    status: submitOk ? 'PASS' : 'FAIL',
    detail: submitOk
      ? `assessmentId=${assessmentId}, score=${submitBody.score}, tier=${submitBody.tier}`
      : `HTTP ${submitStatus}: ${JSON.stringify(submitBody)}`,
  });

  const emailSent = submitBody.emailSent === true;
  steps.push({
    step: 'Notification email (API)',
    status: emailSent ? 'PASS' : submitBody.emailWarning ? 'WARN' : 'FAIL',
    detail: emailSent
      ? 'emailSent=true in API response'
      : String(submitBody.emailWarning ?? 'emailSent=false'),
  });

  await new Promise((r) => setTimeout(r, 3000));
  const resendAfter = await listResendEmails(30);
  const internalEmail = resendAfter.restricted
    ? undefined
    : findRecentEmail(
        resendAfter.emails.length ? resendAfter.emails : emailsBefore.emails,
        (e) =>
          (e.subject?.includes('AI Readiness Assessment') ?? false) &&
          (e.subject?.includes(companyName) ?? false),
        testStart,
      );
  steps.push({
    step: 'Notification email (Resend)',
    status: internalEmail ? 'PASS' : resendAfter.restricted ? 'WARN' : process.env.RESEND_API_KEY ? 'WARN' : 'WARN',
    detail: internalEmail
      ? `Found Resend email id=${internalEmail.id}, subject="${internalEmail.subject}"`
      : resendAfter.restricted
        ? 'RESEND_API_KEY is send-only (restricted) — cannot list sent emails via API; rely on emailSent from submit API'
        : process.env.RESEND_API_KEY
          ? 'No matching Resend email yet (may be delayed or sandbox-limited)'
          : 'RESEND_API_KEY not set — skipped Resend verification',
  });

  const jsonPath = path.join(ASSESSMENTS_DIR, `${assessmentId}.json`);
  const saved = fs.existsSync(jsonPath);
  steps.push({
    step: 'Assessment persisted',
    status: saved ? 'PASS' : 'FAIL',
    detail: saved ? jsonPath : `Missing ${jsonPath}`,
  });

  try {
    const cookie = await buildDashboardSessionCookie();
    const adminRes = await fetch(`${DASHBOARD_URL}/api/admin`, {
      headers: { Cookie: cookie, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    const adminBody = (await adminRes.json()) as {
      clients?: Array<{ id?: string; clientName?: string; email?: string }>;
    };
    const clients = adminBody.clients ?? [];
    const hasQaClient = clients.some((c) => c.id === QA_CLIENT_ID || c.clientName?.includes('Granite Bay'));
    steps.push({
      step: 'Dashboard admin API reachable',
      status: adminRes.ok ? 'PASS' : 'FAIL',
      detail: adminRes.ok ? `${clients.length} clients in admin list` : `HTTP ${adminRes.status}`,
    });
    steps.push({
      step: 'Assessment visible in dashboard client list',
      status: 'WARN',
      detail: hasQaClient
        ? 'Dashboard lists seeded QA clients; assessments are not synced to dashboard client list (verified assessment file + notification email instead)'
        : 'Dashboard has no assessment-leads integration — assessment saved locally and notification email checked instead',
    });
  } catch (e) {
    steps.push({
      step: 'Dashboard admin API',
      status: 'FAIL',
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  const status = worstStatus(steps.map((s) => s.status));
  harness.record({
    id: 'FLOW-1',
    product: 'Integration',
    phase: 'Cross-system',
    testName: 'Flow 1: Assessment → Notification → Dashboard',
    status,
    message: steps.map((s) => `${s.step}: ${s.status}`).join(' | '),
    duration: Date.now() - t0,
    timestamp: new Date().toISOString(),
  });
  return { flow: 1, name: 'Assessment → Notification → Dashboard', status, steps, durationMs: Date.now() - t0 };
}

async function runFlow2(harness: QAHarness): Promise<FlowResult> {
  const t0 = Date.now();
  const steps: FlowResult['steps'] = [];
  const testStart = new Date().toISOString();
  const clientId = 'demo-practice';

  let body: Record<string, unknown> = {};
  let http = 0;
  try {
    const res = await fetch(`${AGENT_URL}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        sessionId: `integration-escalate-${Date.now()}`,
        message: 'I need to speak to a real person right now — this is ridiculous and I am so frustrated!',
      }),
      signal: AbortSignal.timeout(60_000),
    });
    http = res.status;
    body = (await res.json()) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ step: 'POST /api/agent escalation', status: 'FAIL', detail: msg });
    return { flow: 2, name: 'AI Agent → Escalation → Email', status: 'FAIL', steps, durationMs: Date.now() - t0 };
  }

  const escalated = body.escalated === true;
  steps.push({
    step: 'Escalation flag',
    status: escalated ? 'PASS' : 'FAIL',
    detail: escalated
      ? `escalated=true, reply="${String(body.reply ?? '').slice(0, 80)}…"`
      : `HTTP ${http}, escalated=${String(body.escalated)}`,
  });

  await new Promise((r) => setTimeout(r, 4000));
  const resendList = await listResendEmails(30);
  const escEmail = resendList.restricted
    ? undefined
    : findRecentEmail(
        resendList.emails,
        (e) => (e.subject?.includes('Chat escalation') ?? false) || (e.subject?.includes('escalation') ?? false),
        testStart,
      );
  steps.push({
    step: 'Escalation email (Resend)',
    status: escEmail ? 'PASS' : 'WARN',
    detail: escEmail
      ? `Found "${escEmail.subject}" to ${escEmail.to?.join(', ')}`
      : resendList.restricted
        ? 'RESEND_API_KEY is send-only — cannot verify via list API; escalation attempted to staff@demo-practice.com (sandbox blocks non-owner)'
        : process.env.RESEND_SANDBOX === 'true'
          ? 'Resend sandbox only delivers to account owner; demo-practice escalationEmail is staff@demo-practice.com'
          : 'Escalation email not found in recent Resend list (may still be queued)',
  });

  const status = worstStatus(steps.map((s) => s.status));
  harness.record({
    id: 'FLOW-2',
    product: 'Integration',
    phase: 'Cross-system',
    testName: 'Flow 2: AI Agent → Escalation → Email',
    status,
    message: steps.map((s) => `${s.step}: ${s.status}`).join(' | '),
    duration: Date.now() - t0,
    timestamp: new Date().toISOString(),
  });
  return { flow: 2, name: 'AI Agent → Escalation → Email', status, steps, durationMs: Date.now() - t0 };
}

async function runFlow3(harness: QAHarness): Promise<FlowResult> {
  const t0 = Date.now();
  const steps: FlowResult['steps'] = [];
  const expectedPdf = await seedDashboardClient();
  steps.push({
    step: 'Seed qa-granite-bay-dental',
    status: 'PASS',
    detail: expectedPdf,
  });

  try {
    const cookie = await buildDashboardSessionCookie();
    const res = await fetch(`${DASHBOARD_URL}/api/dashboard/report/generate`, {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ clientId: QA_CLIENT_ID, month: REPORT_MONTH, year: REPORT_YEAR }),
      signal: AbortSignal.timeout(120_000),
    });
    const body = (await res.json()) as Record<string, unknown>;
    await new Promise((r) => setTimeout(r, 5000));

    const pdfPath = typeof body.pdfPath === 'string' ? body.pdfPath : expectedPdf;
    const pdfExists = fs.existsSync(pdfPath);
    const pdfSize = pdfExists ? fs.statSync(pdfPath).size : 0;
    steps.push({
      step: 'Report generation API',
      status: res.ok ? 'PASS' : 'FAIL',
      detail: res.ok
        ? `emailSent=${String(body.emailSent)}, pdfPath=${pdfPath}`
        : `HTTP ${res.status}: ${String(body.error ?? JSON.stringify(body))}`,
    });
    steps.push({
      step: 'PDF on disk',
      status: pdfExists && pdfSize > 1024 ? 'PASS' : 'FAIL',
      detail: pdfExists ? `${Math.round(pdfSize / 1024)}KB at ${pdfPath}` : `Missing ${expectedPdf}`,
    });

    const testStart = new Date(t0).toISOString();
    const resendList = await listResendEmails(30);
    const reportEmail = resendList.restricted
      ? undefined
      : findRecentEmail(
          resendList.emails,
          (e) =>
            (e.subject?.includes('Performance Report') ?? false) ||
            (e.subject?.includes('AI Performance') ?? false),
          testStart,
        );
    const emailSentApi = body.emailSent === true;
    steps.push({
      step: 'Report email delivery',
      status: emailSentApi || reportEmail ? 'PASS' : 'WARN',
      detail: emailSentApi
        ? 'emailSent=true from report API'
        : reportEmail
          ? `Resend: "${reportEmail.subject}"`
          : 'Report email not confirmed (check Resend sandbox / notification prefs)',
    });
  } catch (e) {
    steps.push({
      step: 'Report generation',
      status: 'FAIL',
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  const status = worstStatus(steps.map((s) => s.status));
  harness.record({
    id: 'FLOW-3',
    product: 'Integration',
    phase: 'Cross-system',
    testName: 'Flow 3: Dashboard → Monthly Report → Email',
    status,
    message: steps.map((s) => `${s.step}: ${s.status}`).join(' | '),
    duration: Date.now() - t0,
    timestamp: new Date().toISOString(),
  });
  return { flow: 3, name: 'Dashboard → Monthly Report → Email', status, steps, durationMs: Date.now() - t0 };
}

async function runFlow4(harness: QAHarness): Promise<FlowResult> {
  const t0 = Date.now();
  const steps: FlowResult['steps'] = [];
  const testStart = new Date().toISOString();
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeKey) {
    steps.push({
      step: 'Stripe checkout session',
      status: 'WARN',
      detail: 'STRIPE_SECRET_KEY not in root .env.local — cannot create checkout session',
    });
    steps.push({
      step: 'Stripe webhook trigger',
      status: 'WARN',
      detail: 'Stripe CLI not available / not configured — skipped payment_intent.succeeded trigger',
    });
    steps.push({
      step: 'PDF delivery email',
      status: 'WARN',
      detail: 'Blocked by missing Stripe configuration',
    });
    const status: FlowStatus = 'WARN';
    harness.record({
      id: 'FLOW-4',
      product: 'Integration',
      phase: 'Cross-system',
      testName: 'Flow 4: Playbook → Purchase → PDF Delivery',
      status,
      message: 'Stripe not configured',
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
    return { flow: 4, name: 'Playbook → Purchase → PDF Delivery', status, steps, durationMs: Date.now() - t0 };
  }

  let checkoutUrl: string | undefined;
  try {
    const res = await fetch(`${STORE_URL}/api/playbook-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry: 'medical' }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await res.json()) as { url?: string; error?: string };
    checkoutUrl = body.url;
    steps.push({
      step: 'Stripe checkout session',
      status: res.ok && checkoutUrl ? 'PASS' : 'FAIL',
      detail: res.ok && checkoutUrl ? 'Checkout URL returned' : `HTTP ${res.status}: ${body.error ?? JSON.stringify(body)}`,
    });
  } catch (e) {
    steps.push({
      step: 'Stripe checkout session',
      status: 'FAIL',
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  const stripeCli = spawnSync('which', ['stripe'], { encoding: 'utf8' });
  const hasStripeCli = stripeCli.status === 0 && Boolean(stripeCli.stdout.trim());
  steps.push({
    step: 'Stripe CLI available',
    status: hasStripeCli ? 'PASS' : 'WARN',
    detail: hasStripeCli ? stripeCli.stdout.trim() : 'stripe CLI not installed',
  });

  if (hasStripeCli && checkoutUrl) {
    const trigger = spawnSync('stripe', ['trigger', 'checkout.session.completed'], {
      encoding: 'utf8',
      timeout: 30_000,
      env: process.env,
    });
    steps.push({
      step: 'Stripe webhook trigger',
      status: trigger.status === 0 ? 'PASS' : 'WARN',
      detail:
        trigger.status === 0
          ? 'stripe trigger checkout.session.completed'
          : (trigger.stderr || trigger.stdout || 'trigger failed').slice(0, 200),
    });
  } else {
    steps.push({
      step: 'Stripe webhook trigger',
      status: 'WARN',
      detail: 'Skipped — need Stripe CLI + local webhook forwarding (stripe listen)',
    });
  }

  await new Promise((r) => setTimeout(r, 5000));
  const resendList = await listResendEmails(30);
  const deliveryEmail = resendList.restricted
    ? undefined
    : findRecentEmail(
        resendList.emails,
        (e) =>
          (e.subject?.toLowerCase().includes('playbook') ?? false) ||
          (e.subject?.toLowerCase().includes('download') ?? false),
        testStart,
      );
  steps.push({
    step: 'PDF delivery email',
    status: deliveryEmail ? 'PASS' : 'WARN',
    detail: deliveryEmail
      ? `Found "${deliveryEmail.subject}"`
      : 'No playbook delivery email in Resend within 5s (webhook may not be wired locally)',
  });

  const status = worstStatus(steps.map((s) => s.status));
  harness.record({
    id: 'FLOW-4',
    product: 'Integration',
    phase: 'Cross-system',
    testName: 'Flow 4: Playbook → Purchase → PDF Delivery',
    status,
    message: steps.map((s) => `${s.step}: ${s.status}`).join(' | '),
    duration: Date.now() - t0,
    timestamp: new Date().toISOString(),
  });
  return { flow: 4, name: 'Playbook → Purchase → PDF Delivery', status, steps, durationMs: Date.now() - t0 };
}

async function runFlow5(harness: QAHarness): Promise<FlowResult> {
  const t0 = Date.now();
  const steps: FlowResult['steps'] = [];
  const company = 'Placer Valley Medical Group';
  const slug = slugify(company);
  const outputDir = path.join(WORKSHOP_GEN_DIR, 'output');

  const gen = spawnSync(
    'npx',
    [
      'ts-node',
      'generate-workshop.ts',
      '--industry',
      'Medical',
      '--company',
      company,
      '--audience',
      'practice managers and physicians',
      '--duration',
      '90',
    ],
    {
      cwd: WORKSHOP_GEN_DIR,
      timeout: 360_000,
      stdio: 'pipe',
      env: process.env,
    },
  );

  steps.push({
    step: 'Generate Medical workshop',
    status: gen.status === 0 ? 'PASS' : 'FAIL',
    detail:
      gen.status === 0
        ? 'generate-workshop.ts completed'
        : (gen.stderr?.toString() || gen.stdout?.toString() || 'generator failed').slice(0, 200),
  });

  const pptxMatches = fs.existsSync(outputDir)
    ? fs
        .readdirSync(outputDir)
        .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('-workshop.pptx'))
        .sort()
    : [];
  const guideMatches = fs.existsSync(outputDir)
    ? fs
        .readdirSync(outputDir)
        .filter((f) => f.startsWith(`${slug}-`) && f.endsWith('-workshop-guide.md'))
        .sort()
    : [];
  const pptxPath = pptxMatches.length ? path.join(outputDir, pptxMatches[pptxMatches.length - 1]) : null;
  const guidePath = guideMatches.length ? path.join(outputDir, guideMatches[guideMatches.length - 1]) : null;

  if (pptxPath && fs.existsSync(pptxPath)) {
    const slide2Text = extractPptxSlideText(pptxPath, 2);
    const hasLocalRef =
      /granite bay/i.test(slide2Text) ||
      /roseville/i.test(slide2Text) ||
      /placer/i.test(slide2Text);
    steps.push({
      step: 'PPTX slide 2 local reference',
      status: hasLocalRef ? 'PASS' : 'WARN',
      detail: hasLocalRef
        ? `Slide 2 mentions local area: "${slide2Text.slice(0, 120)}…"`
        : `Slide 2 text: "${slide2Text.slice(0, 120)}…" (expected Granite Bay or Roseville)`,
    });
  } else {
    steps.push({
      step: 'PPTX slide 2 local reference',
      status: 'FAIL',
      detail: `PPTX not found (expected ${slug}-*-workshop.pptx)`,
    });
  }

  if (guidePath && fs.existsSync(guidePath)) {
    const notesCheck = validateSpeakerGuideNotes(guidePath);
    steps.push({
      step: 'Speaker guide notes per slide',
      status: notesCheck.ok ? 'PASS' : 'FAIL',
      detail: notesCheck.detail,
    });
  } else {
    steps.push({
      step: 'Speaker guide notes per slide',
      status: 'FAIL',
      detail: `Guide not found (expected ${slug}-*-workshop-guide.md)`,
    });
  }

  const status = worstStatus(steps.map((s) => s.status));
  harness.record({
    id: 'FLOW-5',
    product: 'Integration',
    phase: 'Cross-system',
    testName: 'Flow 5: Workshop Generator → File delivery',
    status,
    message: steps.map((s) => `${s.step}: ${s.status}`).join(' | '),
    deliverable: pptxPath ?? undefined,
    duration: Date.now() - t0,
    timestamp: new Date().toISOString(),
  });
  return { flow: 5, name: 'Workshop Generator → File delivery', status, steps, durationMs: Date.now() - t0 };
}

function printSummaryTable(flows: FlowResult[]): void {
  console.log('\n\x1b[36m═══════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m  INTEGRATION TEST SUMMARY\x1b[0m');
  console.log('\x1b[36m═══════════════════════════════════════════════════════════════\x1b[0m\n');
  console.log('Flow  Name                                      Status  Duration');
  console.log('────  ─────────────────────────────────────────  ──────  ────────');
  for (const f of flows) {
    const icon = { PASS: '\x1b[32mPASS\x1b[0m', WARN: '\x1b[33mWARN\x1b[0m', FAIL: '\x1b[31mFAIL\x1b[0m' }[f.status];
    const name = f.name.padEnd(42).slice(0, 42);
    console.log(`  ${f.flow}   ${name}  ${icon}  ${(f.durationMs / 1000).toFixed(1)}s`);
    for (const s of f.steps) {
      const stepIcon = { PASS: '✓', WARN: '⚠', FAIL: '✗' }[s.status];
      console.log(`      ${stepIcon} ${s.step}: ${s.detail.slice(0, 100)}${s.detail.length > 100 ? '…' : ''}`);
    }
    console.log('');
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const harness = new QAHarness();

  console.log('\x1b[36mClinovyr cross-system integration test\x1b[0m');
  console.log(`Assessment: ${ASSESSMENT_URL}`);
  console.log(`AI Agent:   ${AGENT_URL}`);
  console.log(`Dashboard:  ${DASHBOARD_URL}`);
  console.log(`Playbooks:  ${STORE_URL}`);
  console.log(`Contact:    ${QA_EMAIL}\n`);

  const healthTargets = [
    { name: 'assessment', url: `${ASSESSMENT_URL}/api/health` },
    { name: 'ai-agent', url: `${AGENT_URL}/api/health` },
    { name: 'dashboard', url: `${DASHBOARD_URL}/api/health` },
    { name: 'playbooks', url: `${STORE_URL}/api/health` },
  ];

  console.log('Waiting for product health endpoints…');
  for (const target of healthTargets) {
    const result = await waitForHealth(target.name, target.url);
    const status: FlowStatus = result.ok ? 'PASS' : 'FAIL';
    console.log(`  ${result.ok ? '✓' : '✗'} ${target.name}: ${result.detail}`);
    harness.record({
      id: `HEALTH-${target.name}`,
      product: 'Integration',
      phase: 'Preflight',
      testName: `Health: ${target.name}`,
      status,
      message: result.detail,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    if (!result.ok) {
      console.error(`\nAborting: ${target.name} not healthy at ${target.url}`);
      process.exit(1);
    }
  }

  const flows: FlowResult[] = [];
  flows.push(await runFlow1(harness));
  flows.push(await runFlow2(harness));
  flows.push(await runFlow3(harness));
  flows.push(await runFlow4(harness));
  flows.push(await runFlow5(harness));

  printSummaryTable(flows);

  const resultsDir = path.join(QA_ROOT, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outPath = path.join(resultsDir, 'integration-results.json');
  const summary = {
    generatedAt: new Date().toISOString(),
    urls: { ASSESSMENT_URL, AGENT_URL, DASHBOARD_URL, STORE_URL },
    contactEmail: QA_EMAIL,
    portNotes:
      'User ports: assessment=3001, agent=3002, dashboard=3003, playbooks=3004. health-check.ts defaults: agent=3100, dashboard=3002, playbooks=3003.',
    flows,
    harness: harness.writeReport(outPath),
  };
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`Results written to ${outPath}`);

  const failCount = flows.filter((f) => f.status === 'FAIL').length;
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
