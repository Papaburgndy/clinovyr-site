import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const QA_ROOT = path.resolve(__dirname, '..');
const WORKSHOP_GEN_DIR = path.resolve(QA_ROOT, '../workshop-generator');
const OUTPUT_DIR = path.join(WORKSHOP_GEN_DIR, 'output');
const ENV_PATH = path.resolve(QA_ROOT, '../../.env.local');

/** Match generate-workshop.ts slugify — filenames use company slug, not industry. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadEnvFiles(): void {
  try {
    const dotenv = require('dotenv') as typeof import('dotenv');
    if (!fs.existsSync(ENV_PATH)) return;
    const parsed = dotenv.parse(fs.readFileSync(ENV_PATH));
    for (const [key, value] of Object.entries(parsed)) {
      if (value) process.env[key] = value;
    }
  } catch {
    // dotenv not available — rely on existing process.env
  }
}

function findLatestOutput(
  dir: string,
  slug: string,
  suffix: '.pptx' | '-guide.md',
): string | null {
  if (!fs.existsSync(dir)) return null;
  const prefix = `${slug}-`;
  const matches = fs
    .readdirSync(dir)
    .filter((f) => {
      if (!f.startsWith(prefix)) return false;
      if (suffix === '.pptx') return f.endsWith('-workshop.pptx');
      return f.endsWith('-workshop-guide.md');
    })
    .sort();
  const name = matches[matches.length - 1];
  return name ? path.join(dir, name) : null;
}

const WORKSHOPS = [
  {
    industry: 'Medical',
    company: 'Placer Valley Medical Group',
    audience: 'practice managers and physicians',
    duration: 90,
  },
  {
    industry: 'Real Estate',
    company: 'Sierra Foothills Realty',
    audience: 'agents and brokers',
    duration: 90,
  },
  {
    industry: 'Legal',
    company: 'Roseville Business Law Group',
    audience: 'attorneys and paralegals',
    duration: 60,
  },
  {
    industry: 'Construction',
    company: 'Granite Bay Builders',
    audience: 'project managers and owners',
    duration: 90,
  },
  {
    industry: 'Wellness',
    company: 'Rocklin Med Spa & Wellness',
    audience: 'spa directors and staff',
    duration: 60,
  },
  {
    industry: 'Retail',
    company: 'Fountains Retail Partners',
    audience: 'retail managers and owners',
    duration: 60,
  },
];

export async function runPhase2(harness: QAHarness): Promise<void> {
  loadEnvFiles();
  console.log('\n\x1b[33m── PHASE 2: WORKSHOP GENERATOR ──\x1b[0m');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const onlyIndustry = process.env.PHASE2_INDUSTRY?.trim();
  const workshops = onlyIndustry
    ? WORKSHOPS.filter((w) => w.industry === onlyIndustry)
    : WORKSHOPS;

  if (onlyIndustry && workshops.length === 0) {
    harness.record({
      id: 'W-CONFIG',
      product: 'Workshop Generator',
      phase: 'Tier A',
      testName: 'Phase 2 industry filter',
      status: 'FAIL',
      message: `PHASE2_INDUSTRY="${onlyIndustry}" does not match any workshop fixture`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    harness.record({
      id: 'W-ENV',
      product: 'Workshop Generator',
      phase: 'Tier A',
      testName: 'Anthropic API key for workshops',
      status: 'WARN',
      message:
        'ANTHROPIC_API_KEY not set — generator will use fallback outline (dry-run)',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }

  for (const w of workshops) {
    const t0 = Date.now();
    const slug = slugify(w.company);

    const result = spawnSync(
      'npx',
      [
        'ts-node',
        'generate-workshop.ts',
        '--industry',
        w.industry,
        '--company',
        w.company,
        '--audience',
        w.audience,
        '--duration',
        String(w.duration),
      ],
      {
        cwd: WORKSHOP_GEN_DIR,
        timeout: 360_000,
        stdio: 'pipe',
        env: process.env,
      },
    );

    if (result.status !== 0) {
      const timedOut = result.signal === 'SIGTERM' || result.error?.message?.includes('ETIMEDOUT');
      const detail = timedOut
        ? 'Generator timed out (live Claude calls often need 3–5 minutes)'
        : result.stderr?.toString().slice(0, 200) ||
          result.stdout?.toString().slice(0, 200) ||
          `exit code ${result.status ?? 'unknown'}`;
      harness.record({
        id: `W-${w.industry}`,
        product: 'Workshop Generator',
        phase: 'Tier A',
        testName: `Generate: ${w.industry} workshop`,
        status: 'FAIL',
        message: `Generator failed: ${detail}`,
        duration: Date.now() - t0,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const pptx = findLatestOutput(OUTPUT_DIR, slug, '.pptx');
    const guide = findLatestOutput(OUTPUT_DIR, slug, '-guide.md');

    const pptxSize = pptx && fs.existsSync(pptx) ? fs.statSync(pptx).size : 0;
    const guideSize = guide && fs.existsSync(guide) ? fs.statSync(guide).size : 0;

    harness.record({
      id: `W-${w.industry}-PPTX`,
      product: 'Workshop Generator',
      phase: 'Tier A',
      testName: `PPTX: ${w.industry}`,
      status: pptxSize > 15_000 ? 'PASS' : pptxSize > 0 ? 'WARN' : 'FAIL',
      deliverable: pptx ?? undefined,
      deliverableSize: pptxSize,
      message: pptx
        ? `${(pptxSize / 1024).toFixed(1)}KB (${path.basename(pptx)}) — ${pptxSize > 15_000 ? 'OK' : 'Too small, may have empty slides'}`
        : `PPTX not generated (expected prefix: ${slug}-*-workshop.pptx)`,
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });

    harness.record({
      id: `W-${w.industry}-GUIDE`,
      product: 'Workshop Generator',
      phase: 'Tier A',
      testName: `Speaker guide: ${w.industry}`,
      status: guideSize > 3000 ? 'PASS' : guideSize > 0 ? 'WARN' : 'FAIL',
      deliverable: guide ?? undefined,
      deliverableSize: guideSize,
      message: guide
        ? `${(guideSize / 1024).toFixed(1)}KB speaker guide (${path.basename(guide)})`
        : `Guide not generated (expected prefix: ${slug}-*-workshop-guide.md)`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    if (guide && fs.existsSync(guide)) {
      const content = fs.readFileSync(guide, 'utf8');
      const hasSpeakerNotes =
        content.includes('Speaker Notes') ||
        content.includes('speaker notes');
      const hasIndustryWord = content
        .toLowerCase()
        .includes(w.industry.toLowerCase());
      const hasCompanyName = content.includes(w.company);
      const noPlaceholders =
        !content.includes('[INSERT]') &&
        !content.includes('{{') &&
        !content.includes('TBD');

      harness.record({
        id: `W-${w.industry}-CONTENT`,
        product: 'Workshop Generator',
        phase: 'Tier A',
        testName: `Content quality: ${w.industry}`,
        status:
          hasSpeakerNotes && hasIndustryWord && noPlaceholders ? 'PASS' : 'WARN',
        message: [
          hasSpeakerNotes ? '✓ Speaker notes present' : '✗ Missing speaker notes',
          hasIndustryWord
            ? '✓ Industry-specific content'
            : '✗ No industry references',
          hasCompanyName ? '✓ Company name used' : '⚠ Company name not found',
          noPlaceholders ? '✓ No placeholder text' : '✗ Placeholder text found',
        ].join(' | '),
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase2(harness)
    .then(() => {
      const s = harness.summary();
      console.log(`\nPhase 2: Pass ${s.pass} | Fail ${s.fail} | Warn ${s.warn}`);
    })
    .catch(console.error);
}
