import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, type ChildProcess } from 'child_process';

const QA_ROOT = path.resolve(__dirname, '..');
const AI_AGENT_DIR = path.resolve(QA_ROOT, '../ai-agent');
const CLIENT_CONFIG_DIR = path.join(AI_AGENT_DIR, 'config/clients');
const ENV_PATH = path.resolve(QA_ROOT, '../../.env.local');
const AI_AGENT_ENV_PATH = path.join(AI_AGENT_DIR, '.env.local');

/**
 * Default ai-agent dev port (see clinovyr-products/health-check.ts).
 * Port 3002 is the dashboard, not the agent.
 */
const DEFAULT_AGENT_PORT = 3100;

/** Spec fixture; only demo-practice exists under ai-agent/config/clients today. */
const PREFERRED_CLIENT_ID = 'granite-bay-dental';
const FALLBACK_CLIENT_ID = 'demo-practice';

function loadEnvFiles(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    for (const envFile of [ENV_PATH, AI_AGENT_ENV_PATH]) {
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

function resolveAgentPort(base: string): number {
  const fromEnv = process.env.AGENT_PORT?.trim();
  if (fromEnv) return Number(fromEnv);
  try {
    const u = new URL(base);
    if (u.port) return Number(u.port);
  } catch {
    // ignore
  }
  return DEFAULT_AGENT_PORT;
}

function resolveAgentBase(): string {
  const explicit =
    process.env.AGENT_BASE?.trim() || process.env.AGENT_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const port = Number(process.env.AGENT_PORT ?? DEFAULT_AGENT_PORT);
  return `http://localhost:${port}`;
}

function resolveClientId(): { clientId: string; usedFallback: boolean } {
  const override = process.env.QA_AGENT_CLIENT_ID?.trim();
  if (override) return { clientId: override, usedFallback: false };

  const preferredPath = path.join(CLIENT_CONFIG_DIR, `${PREFERRED_CLIENT_ID}.json`);
  if (fs.existsSync(preferredPath)) {
    return { clientId: PREFERRED_CLIENT_ID, usedFallback: false };
  }

  return { clientId: FALLBACK_CLIENT_ID, usedFallback: true };
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

async function isAgentHealthy(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === 'ok' || data.status === 'degraded';
  } catch {
    return false;
  }
}

let devChild: ChildProcess | null = null;

function startAgentDev(base: string): boolean {
  const port = resolveAgentPort(base);
  devChild = spawn('npm', ['run', 'dev'], {
    cwd: AI_AGENT_DIR,
    env: { ...process.env, PORT: String(port) },
    stdio: 'pipe',
    detached: process.platform !== 'win32',
  });

  devChild.unref?.();
  return true;
}

async function ensureAgentRunning(base: string): Promise<boolean> {
  if (await isAgentHealthy(base)) return true;

  console.log(`AI agent not reachable at ${base} — starting npm run dev in ai-agent…`);
  if (!startAgentDev(base)) return false;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isAgentHealthy(base)) return true;
  }
  return false;
}

async function postAgent(
  base: string,
  body: { clientId: string; sessionId: string; message: string },
): Promise<{ ok: boolean; status: number; body: Record<string, unknown>; duration: number }> {
  const start = Date.now();
  const res = await fetchJson(`${base}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  return { ...res, duration: Date.now() - start };
}

export async function runPhase4(harness: QAHarness): Promise<void> {
  loadEnvFiles();
  const agentBase = resolveAgentBase();
  const { clientId, usedFallback } = resolveClientId();

  console.log('\n\x1b[33m── PHASE 4: AI AGENT ──\x1b[0m');
  console.log(
    `Agent base: ${agentBase} (POST /api/agent, GET /widget.js — not /api/chat; dashboard uses port 3002)`,
  );

  const preferredConfig = path.join(CLIENT_CONFIG_DIR, `${PREFERRED_CLIENT_ID}.json`);
  harness.record({
    id: 'AGENT-CONFIG',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: `Client config: ${PREFERRED_CLIENT_ID}`,
    status: fs.existsSync(preferredConfig) ? 'PASS' : 'WARN',
    message: fs.existsSync(preferredConfig)
      ? `Config found at ${preferredConfig}`
      : `No ${PREFERRED_CLIENT_ID}.json — using ${FALLBACK_CLIENT_ID} for live API tests`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  if (usedFallback) {
    const fallbackPath = path.join(CLIENT_CONFIG_DIR, `${FALLBACK_CLIENT_ID}.json`);
    harness.record({
      id: 'AGENT-CLIENT',
      product: 'AI Agent',
      phase: 'Tier A',
      testName: 'QA client fixture',
      status: fs.existsSync(fallbackPath) ? 'PASS' : 'FAIL',
      message: `Live tests use clientId="${clientId}"`,
      deliverable: fs.existsSync(fallbackPath) ? fallbackPath : undefined,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const running = await ensureAgentRunning(agentBase);
  if (!running) {
    harness.record({
      id: 'AGENT-UP',
      product: 'AI Agent',
      phase: 'Tier A',
      testName: 'AI agent server reachable',
      status: 'FAIL',
      message: `Could not reach ${agentBase}/api/health after starting dev server`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  harness.record({
    id: 'AGENT-UP',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'AI agent server reachable',
    status: 'PASS',
    message: `Health OK at ${agentBase}/api/health`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  const healthStart = Date.now();
  const health = await fetchJson(`${agentBase}/api/health`);
  harness.record({
    id: 'AGENT-HEALTH',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'GET /api/health',
    status:
      health.ok &&
      (health.body.status === 'ok' || health.body.status === 'degraded')
        ? 'PASS'
        : 'FAIL',
    message: `status=${String(health.body.status)} http=${health.status}`,
    duration: Date.now() - healthStart,
    timestamp: new Date().toISOString(),
  });

  const widgetStart = Date.now();
  let widgetText = '';
  let widgetStatus = 0;
  try {
    const widgetRes = await fetch(`${agentBase}/widget.js`, {
      signal: AbortSignal.timeout(10_000),
    });
    widgetStatus = widgetRes.status;
    widgetText = await widgetRes.text();
  } catch (e: unknown) {
    widgetText = e instanceof Error ? e.message : String(e);
  }

  const widgetHasAgentApi = widgetText.includes('/api/agent');
  const widgetHasClientAttr = widgetText.includes('data-client-id');
  harness.record({
    id: 'AGENT-WIDGET',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'GET /widget.js (static public/)',
    status:
      widgetStatus === 200 && widgetHasAgentApi && widgetHasClientAttr
        ? 'PASS'
        : 'FAIL',
    message: [
      widgetStatus === 200 ? '✓ 200 OK' : `✗ HTTP ${widgetStatus}`,
      widgetHasAgentApi ? '✓ calls /api/agent' : '✗ missing /api/agent',
      widgetHasClientAttr ? '✓ data-client-id' : '✗ missing data-client-id',
    ].join(' | '),
    duration: Date.now() - widgetStart,
    timestamp: new Date().toISOString(),
  });

  const config = JSON.parse(
    fs.readFileSync(path.join(CLIENT_CONFIG_DIR, `${clientId}.json`), 'utf8'),
  ) as { hours?: string; businessName?: string };

  const hoursRes = await postAgent(agentBase, {
    clientId,
    sessionId: `qa-hours-${Date.now()}`,
    message: 'What are your hours?',
  });

  const hoursReply = typeof hoursRes.body.reply === 'string' ? hoursRes.body.reply : '';
  const hoursHint = config.hours?.toLowerCase() ?? '';
  const hoursOk =
    hoursRes.ok &&
    hoursRes.status === 200 &&
    hoursReply.length > 0 &&
    hoursRes.body.escalated === false &&
    (hoursHint
      ? hoursReply.toLowerCase().includes('hour') ||
        hoursReply.toLowerCase().includes('monday') ||
        hoursReply.includes(config.hours!.slice(0, 20))
      : true);

  harness.record({
    id: 'AGENT-HOURS',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'POST /api/agent — hours FAQ',
    status: hoursOk ? 'PASS' : 'FAIL',
    message: hoursOk
      ? `reply length ${hoursReply.length}, escalated=false`
      : `http=${hoursRes.status} escalated=${String(hoursRes.body.escalated)} reply=${hoursReply.slice(0, 120)}`,
    duration: hoursRes.duration,
    timestamp: new Date().toISOString(),
  });

  const escRes = await postAgent(agentBase, {
    clientId,
    sessionId: `qa-escalate-${Date.now()}`,
    message: 'I need to speak to a real person right now',
  });

  const escReply = typeof escRes.body.reply === 'string' ? escRes.body.reply : '';
  const escOk =
    escRes.ok &&
    escRes.status === 200 &&
    escRes.body.escalated === true &&
    escReply.length > 0;

  harness.record({
    id: 'AGENT-ESCALATE',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'POST /api/agent — human escalation',
    status: escOk ? 'PASS' : 'FAIL',
    message: escOk
      ? `escalated=true, reply preview: ${escReply.slice(0, 80)}…`
      : `http=${escRes.status} escalated=${String(escRes.body.escalated)} error=${String(escRes.body.error ?? '')}`,
    duration: escRes.duration,
    timestamp: new Date().toISOString(),
  });

  const sessionId = `qa-session-${Date.now()}`;
  const shapeRes = await postAgent(agentBase, {
    clientId,
    sessionId,
    message: 'Do you accept insurance?',
  });

  const hasReply = typeof shapeRes.body.reply === 'string';
  const hasEscalated = typeof shapeRes.body.escalated === 'boolean';
  const hasSession =
    typeof shapeRes.body.sessionId === 'string' &&
    shapeRes.body.sessionId.length > 0;

  harness.record({
    id: 'AGENT-SHAPE',
    product: 'AI Agent',
    phase: 'Tier A',
    testName: 'Response shape: reply, escalated, sessionId',
    status: shapeRes.ok && hasReply && hasEscalated && hasSession ? 'PASS' : 'FAIL',
    message: [
      hasReply ? '✓ reply' : '✗ reply',
      hasEscalated ? `✓ escalated=${shapeRes.body.escalated}` : '✗ escalated',
      hasSession ? '✓ sessionId' : '✗ sessionId',
    ].join(' | '),
    duration: shapeRes.duration,
    timestamp: new Date().toISOString(),
  });
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase4(harness)
    .then(() => {
      const s = harness.summary();
      const verdict = s.fail === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      console.log(
        `\nPhase 4: ${verdict} — Pass ${s.pass} | Fail ${s.fail} | Warn ${s.warn} | ${s.elapsed}s`,
      );
      process.exit(s.fail === 0 ? 0 : 1);
    })
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
