import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, spawnSync, type ChildProcess } from 'child_process';

const QA_ROOT = path.resolve(__dirname, '..');
const PLAYBOOKS_DIR = path.resolve(QA_ROOT, '../playbooks');
const CONTENT_DIR = path.join(PLAYBOOKS_DIR, 'content', 'playbooks');
const PDF_DIR = path.join(PLAYBOOKS_DIR, 'output', 'pdfs');
const ENV_PATH = path.resolve(QA_ROOT, '../../.env.local');
const PLAYBOOKS_ENV_PATH = path.join(PLAYBOOKS_DIR, '.env.local');

/** Align with clinovyr-products/health-check.ts (not README default 3000). */
const DEFAULT_PLAYBOOKS_PORT = 3003;
const VERSION = 1;

/** Mirrors playbooks/src/validators/playbook-validator.ts */
const MIN_WORD_COUNT = 8000;
const MIN_JSON_BYTES = 40_000;
const MIN_PDF_BYTES = 50_000;

const INDUSTRIES = [
  { key: 'Medical', slug: 'medical', label: 'Medical & Dental' },
  { key: 'Real Estate', slug: 'real-estate', label: 'Real Estate' },
  { key: 'Legal', slug: 'legal', label: 'Legal' },
  { key: 'Construction', slug: 'construction', label: 'Construction' },
  { key: 'Wellness', slug: 'wellness', label: 'Wellness & Med Spa' },
] as const;

type IndustryFixture = (typeof INDUSTRIES)[number];

type PlaybookJson = {
  slug?: string;
  title?: string;
  chapters?: Array<{
    sections?: Array<{ content?: string; title?: string }>;
  }>;
  toolDirectory?: unknown[];
  promptLibrary?: unknown[];
};

function loadEnvFiles(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    for (const envFile of [ENV_PATH, PLAYBOOKS_ENV_PATH]) {
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

function resolvePlaybooksPort(base: string): number {
  const fromEnv = process.env.PLAYBOOKS_PORT?.trim();
  if (fromEnv) return Number(fromEnv);
  try {
    const u = new URL(base);
    if (u.port) return Number(u.port);
  } catch {
    // ignore
  }
  return DEFAULT_PLAYBOOKS_PORT;
}

function resolvePlaybooksBase(): string {
  const explicit =
    process.env.PLAYBOOKS_BASE?.trim() ||
    process.env.STORE_URL?.trim() ||
    process.env.PLAYBOOKS_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const port = Number(process.env.PLAYBOOKS_PORT ?? DEFAULT_PLAYBOOKS_PORT);
  return `http://localhost:${port}`;
}

function getPlaybooksDevEnv(base: string): NodeJS.ProcessEnv {
  const port = resolvePlaybooksPort(base);
  return {
    ...process.env,
    PORT: String(port),
    SITE_URL: process.env.SITE_URL ?? base,
  };
}

function jsonPath(slug: string): string {
  return path.join(CONTENT_DIR, slug, `v${VERSION}.json`);
}

function pdfPath(slug: string): string {
  return path.join(PDF_DIR, `${slug}-v${VERSION}.pdf`);
}

function countPlaybookWords(playbook: PlaybookJson): number {
  const parts: string[] = [];
  if (playbook.title) parts.push(playbook.title);
  for (const chapter of playbook.chapters ?? []) {
    for (const section of chapter.sections ?? []) {
      if (section.title) parts.push(section.title);
      if (section.content) parts.push(section.content);
    }
  }
  return parts
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function loadPlaybookJson(slug: string): PlaybookJson | null {
  const filePath = jsonPath(slug);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PlaybookJson;
  } catch {
    return null;
  }
}

function validatePlaybookJson(
  slug: string,
  playbook: PlaybookJson | null,
  filePath: string,
): { status: 'PASS' | 'WARN' | 'FAIL'; message: string; wordCount: number } {
  if (!playbook) {
    return {
      status: 'FAIL',
      message: `Invalid or missing JSON at ${filePath}`,
      wordCount: 0,
    };
  }

  const wordCount = countPlaybookWords(playbook);
  const chapterCount = playbook.chapters?.length ?? 0;
  const toolCount = playbook.toolDirectory?.length ?? 0;
  const promptCount = playbook.promptLibrary?.length ?? 0;
  const fileSize = fs.statSync(filePath).size;

  const issues: string[] = [];
  if (wordCount < MIN_WORD_COUNT) {
    issues.push(`word count ${wordCount} < ${MIN_WORD_COUNT}`);
  }
  if (chapterCount < 7) {
    issues.push(`chapters ${chapterCount} < 7`);
  }
  if (toolCount < 8) {
    issues.push(`tools ${toolCount} < 8`);
  }
  if (promptCount < 10) {
    issues.push(`prompts ${promptCount} < 10`);
  }
  if (playbook.slug && playbook.slug !== slug) {
    issues.push(`slug mismatch: ${playbook.slug} vs ${slug}`);
  }

  const thin = wordCount < MIN_WORD_COUNT || fileSize < MIN_JSON_BYTES;
  if (issues.length === 0) {
    return {
      status: 'PASS',
      message: `${wordCount} words | ${chapterCount} ch | ${toolCount} tools | ${promptCount} prompts | ${(fileSize / 1024).toFixed(1)}KB`,
      wordCount,
    };
  }
  if (thin) {
    return {
      status: 'WARN',
      message: `Thin or incomplete content (${issues.join('; ')}) — regenerate: npm run generate -- --industry "${slugToKey(slug)}" --version ${VERSION}`,
      wordCount,
    };
  }
  return {
    status: 'WARN',
    message: issues.join('; '),
    wordCount,
  };
}

function slugToKey(slug: string): string {
  const found = INDUSTRIES.find((i) => i.slug === slug);
  return found?.key ?? slug;
}

function runGenerate(industry: IndustryFixture, dryRun: boolean) {
  const args = [
    'ts-node',
    '--project',
    'tsconfig.cli.json',
    'src/generate-playbook.ts',
    '--industry',
    industry.key,
    '--version',
    String(VERSION),
  ];
  if (dryRun) args.push('--dry-run');

  return spawnSync('npx', args, {
    cwd: PLAYBOOKS_DIR,
    timeout: 900_000,
    stdio: 'pipe',
    env: process.env,
  });
}

function runBuildPdf(slug: string) {
  return spawnSync(
    'npx',
    [
      'ts-node',
      '--project',
      'tsconfig.cli.json',
      'src/build-pdf.ts',
      '--industry',
      slug,
      '--version',
      String(VERSION),
    ],
    {
      cwd: PLAYBOOKS_DIR,
      timeout: 300_000,
      stdio: 'pipe',
      env: process.env,
    },
  );
}

function validatePdfFile(filePath: string): {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  size: number;
} {
  if (!fs.existsSync(filePath)) {
    return { status: 'FAIL', message: 'PDF not found', size: 0 };
  }
  const size = fs.statSync(filePath).size;
  const header = fs.readFileSync(filePath).subarray(0, 5).toString('ascii');
  if (!header.startsWith('%PDF')) {
    return { status: 'FAIL', message: 'Invalid PDF header', size };
  }
  if (size < MIN_PDF_BYTES) {
    return {
      status: 'WARN',
      message: `${(size / 1024).toFixed(1)}KB — below ${MIN_PDF_BYTES / 1024}KB minimum (may be stub/fallback PDF)`,
      size,
    };
  }
  return {
    status: 'PASS',
    message: `${(size / 1024).toFixed(1)}KB at output/pdfs/${path.basename(filePath)}`,
    size,
  };
}

async function probePlaybooksHealth(
  base: string,
): Promise<{
  ok: boolean;
  reachable: boolean;
  status: string;
  http: number;
  filesystem?: boolean;
}> {
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    let body: { status?: string; checks?: { filesystem?: boolean } } = {};
    try {
      body = (await res.json()) as typeof body;
    } catch {
      body = {};
    }
    const status = body.status ?? 'unknown';
    const filesystem = body.checks?.filesystem;
    // Playbooks returns 503 when STRIPE_* is missing (status "error") but the app is still up.
    const ok =
      status === 'ok' ||
      status === 'degraded' ||
      (filesystem === true && status !== 'unknown');
    return {
      ok,
      reachable: true,
      status,
      http: res.status,
      filesystem,
    };
  } catch {
    return { ok: false, reachable: false, status: 'unreachable', http: 0 };
  }
}

let devChild: ChildProcess | null = null;

function killProcessOnPort(port: number): void {
  try {
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

function startPlaybooksDev(base: string): void {
  const port = resolvePlaybooksPort(base);
  devChild = spawn(
    'npm',
    ['run', 'dev', '--', '-p', String(port)],
    {
      cwd: PLAYBOOKS_DIR,
      env: getPlaybooksDevEnv(base),
      stdio: 'pipe',
      detached: process.platform !== 'win32',
    },
  );
  devChild.unref?.();
}

async function ensurePlaybooksRunning(base: string): Promise<boolean> {
  let health = await probePlaybooksHealth(base);
  if (health.ok) return true;
  if (health.reachable && health.filesystem) return true;

  if (health.reachable && !health.filesystem) {
    console.log(
      `Playbooks on ${base} returned health=${health.status} without writable data dir — restarting…`,
    );
    killProcessOnPort(resolvePlaybooksPort(base));
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(
    `Playbooks not reachable at ${base} — starting dev server (port ${resolvePlaybooksPort(base)}, health-check.ts)…`,
  );
  startPlaybooksDev(base);

  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    health = await probePlaybooksHealth(base);
    if (health.ok || (health.reachable && health.filesystem)) return true;
  }
  return false;
}

async function testPlaybookCheckout(
  base: string,
  slug: string,
): Promise<{ status: 'PASS' | 'WARN' | 'FAIL'; message: string }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeKey) {
    return {
      status: 'WARN',
      message:
        'STRIPE_SECRET_KEY not set — skipping live checkout (POST /api/playbook-checkout)',
    };
  }

  try {
    const res = await fetch(`${base}/api/playbook-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry: slug }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await res.json()) as { url?: string; error?: string };

    if (!res.ok) {
      return {
        status: 'FAIL',
        message: `HTTP ${res.status}: ${body.error ?? JSON.stringify(body)}`,
      };
    }
    if (body.url?.startsWith('https://checkout.stripe.com')) {
      return {
        status: 'PASS',
        message: `Checkout session URL returned for industry="${slug}"`,
      };
    }
    return {
      status: 'FAIL',
      message: body.error ?? 'Response missing checkout.stripe.com URL',
    };
  } catch (e) {
    return {
      status: 'FAIL',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runPhase6(harness: QAHarness): Promise<void> {
  loadEnvFiles();
  const playbooksBase = resolvePlaybooksBase();

  console.log('\n\x1b[33m── PHASE 6: INDUSTRY PLAYBOOKS ──\x1b[0m');
  console.log(
    `Paths: content/playbooks/{slug}/v${VERSION}.json | output/pdfs/{slug}-v${VERSION}.pdf | API POST /api/playbook-checkout { industry: slug } | port ${DEFAULT_PLAYBOOKS_PORT}`,
  );

  const onlyIndustry = process.env.PHASE6_INDUSTRY?.trim();
  const industries = onlyIndustry
    ? INDUSTRIES.filter(
        (i) =>
          i.key === onlyIndustry ||
          i.slug === onlyIndustry.toLowerCase() ||
          i.label === onlyIndustry,
      )
    : [...INDUSTRIES];

  if (onlyIndustry && industries.length === 0) {
    harness.record({
      id: 'PB-CONFIG',
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: 'Phase 6 industry filter',
      status: 'FAIL',
      message: `PHASE6_INDUSTRY="${onlyIndustry}" does not match any fixture (use Medical, Real Estate, Legal, Construction, Wellness)`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    harness.record({
      id: 'PB-ENV',
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: 'Anthropic API key for playbooks',
      status: 'WARN',
      message:
        'ANTHROPIC_API_KEY not set — generation uses fallback (--dry-run behavior)',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const forceGenerate = process.env.PHASE6_FORCE_GENERATE === '1';
  const dryRun = !process.env.ANTHROPIC_API_KEY || process.env.PHASE6_DRY_RUN === '1';

  for (const industry of industries) {
    const t0 = Date.now();
    const jsonFile = jsonPath(industry.slug);
    const existingSize = fs.existsSync(jsonFile) ? fs.statSync(jsonFile).size : 0;
    const existing = loadPlaybookJson(industry.slug);
    const existingWords = existing ? countPlaybookWords(existing) : 0;
    const hasSubstantialJson =
      existing &&
      existingWords >= MIN_WORD_COUNT &&
      existingSize >= MIN_JSON_BYTES;

    if (hasSubstantialJson && !forceGenerate) {
      harness.record({
        id: `PB-${industry.key}-GEN`,
        product: 'Industry Playbooks',
        phase: 'Tier A',
        testName: `Generate: ${industry.key}`,
        status: 'PASS',
        message: `Skipped generation — using pre-generated ${path.relative(PLAYBOOKS_DIR, jsonFile)} (${existingWords} words)`,
        deliverable: jsonFile,
        deliverableSize: existingSize,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    } else {
      const gen = runGenerate(industry, dryRun);
      if (gen.status !== 0) {
        const detail =
          gen.stderr?.toString().slice(0, 250) ||
          gen.stdout?.toString().slice(0, 250) ||
          `exit ${gen.status ?? 'unknown'}`;
        harness.record({
          id: `PB-${industry.key}-GEN`,
          product: 'Industry Playbooks',
          phase: 'Tier A',
          testName: `Generate: ${industry.key}`,
          status: 'FAIL',
          message: `npx ts-node src/generate-playbook.ts --industry "${industry.key}" failed: ${detail}`,
          duration: Date.now() - t0,
          timestamp: new Date().toISOString(),
        });
        continue;
      }
      harness.record({
        id: `PB-${industry.key}-GEN`,
        product: 'Industry Playbooks',
        phase: 'Tier A',
        testName: `Generate: ${industry.key}`,
        status: 'PASS',
        message: dryRun
          ? `Generated with --dry-run (${industry.key} → slug ${industry.slug})`
          : `Generated via Claude (${industry.key})`,
        deliverable: jsonFile,
        deliverableSize: fs.existsSync(jsonFile) ? fs.statSync(jsonFile).size : 0,
        duration: Date.now() - t0,
        timestamp: new Date().toISOString(),
      });
    }

    const playbook = loadPlaybookJson(industry.slug);
    const jsonValidation = validatePlaybookJson(
      industry.slug,
      playbook,
      jsonFile,
    );
    harness.record({
      id: `PB-${industry.key}-JSON`,
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: `JSON validation: ${industry.key}`,
      status: jsonValidation.status,
      deliverable: fs.existsSync(jsonFile) ? jsonFile : undefined,
      message: jsonValidation.message,
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    const pdfFile = pdfPath(industry.slug);
    const pdfExists =
      fs.existsSync(pdfFile) && fs.statSync(pdfFile).size >= MIN_PDF_BYTES;
    const forcePdf = process.env.PHASE6_FORCE_PDF === '1';

    if (!pdfExists || forcePdf) {
      const pdfStart = Date.now();
      const built = runBuildPdf(industry.slug);
      if (built.status !== 0) {
        harness.record({
          id: `PB-${industry.key}-PDF-BUILD`,
          product: 'Industry Playbooks',
          phase: 'Tier A',
          testName: `Build PDF: ${industry.key}`,
          status: 'FAIL',
          message:
            built.stderr?.toString().slice(0, 200) ||
            built.stdout?.toString().slice(0, 200) ||
            'build-pdf failed',
          duration: Date.now() - pdfStart,
          timestamp: new Date().toISOString(),
        });
      } else {
        harness.record({
          id: `PB-${industry.key}-PDF-BUILD`,
          product: 'Industry Playbooks',
          phase: 'Tier A',
          testName: `Build PDF: ${industry.key}`,
          status: 'PASS',
          message: `Built ${path.relative(PLAYBOOKS_DIR, pdfFile)}`,
          deliverable: pdfFile,
          deliverableSize: fs.existsSync(pdfFile) ? fs.statSync(pdfFile).size : 0,
          duration: Date.now() - pdfStart,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      harness.record({
        id: `PB-${industry.key}-PDF-BUILD`,
        product: 'Industry Playbooks',
        phase: 'Tier A',
        testName: `Build PDF: ${industry.key}`,
        status: 'PASS',
        message: `Skipped build — existing ${path.basename(pdfFile)}`,
        deliverable: pdfFile,
        deliverableSize: fs.statSync(pdfFile).size,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const pdfValidation = validatePdfFile(pdfFile);
    harness.record({
      id: `PB-${industry.key}-PDF`,
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: `PDF validation: ${industry.key}`,
      status: pdfValidation.status,
      deliverable: fs.existsSync(pdfFile) ? pdfFile : undefined,
      deliverableSize: pdfValidation.size,
      message: pdfValidation.message,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const skipServer = process.env.PHASE6_SKIP_SERVER === '1';
  if (skipServer) {
    harness.record({
      id: 'PB-SERVER',
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: 'Playbooks dev server',
      status: 'SKIP',
      message: 'PHASE6_SKIP_SERVER=1 — skipped health and Stripe checkout',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const serverStart = Date.now();
  const running = await ensurePlaybooksRunning(playbooksBase);
  if (!running) {
    harness.record({
      id: 'PB-SERVER',
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: 'Playbooks dev server',
      status: 'FAIL',
      message: `Could not reach ${playbooksBase}/api/health (expected port ${DEFAULT_PLAYBOOKS_PORT})`,
      duration: Date.now() - serverStart,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const health = await probePlaybooksHealth(playbooksBase);
  const stripeInHealth = health.status === 'error';
  harness.record({
    id: 'PB-SERVER',
    product: 'Industry Playbooks',
    phase: 'Tier A',
    testName: 'Playbooks dev server',
    status: stripeInHealth ? 'WARN' : 'PASS',
    message: stripeInHealth
      ? `App reachable at ${playbooksBase}/api/health (HTTP ${health.http}, status=${health.status} — missing STRIPE_* in env)`
      : `Health OK at ${playbooksBase}/api/health`,
    duration: Date.now() - serverStart,
    timestamp: new Date().toISOString(),
  });

  for (const industry of industries) {
    const checkout = await testPlaybookCheckout(playbooksBase, industry.slug);
    harness.record({
      id: `PB-${industry.key}-STRIPE`,
      product: 'Industry Playbooks',
      phase: 'Tier A',
      testName: `Stripe checkout: ${industry.key}`,
      status: checkout.status,
      message: checkout.message,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase6(harness)
    .then(() => {
      const s = harness.summary();
      console.log(
        `\nPhase 6: Pass ${s.pass} | Fail ${s.fail} | Warn ${s.warn} | ${s.elapsed}s`,
      );
      process.exit(s.fail > 0 ? 1 : 0);
    })
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
