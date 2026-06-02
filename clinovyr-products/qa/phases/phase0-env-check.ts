import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';

const QA_ROOT = path.resolve(__dirname, '..');

const ENV_PATH = path.resolve(QA_ROOT, '../../.env.local');

function loadEnvFiles() {
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

export async function runEnvCheck(harness: QAHarness) {
  loadEnvFiles();
  console.log('\n\x1b[33m── ENV CHECK ──\x1b[0m');

  // 1. ANTHROPIC API KEY — check format and do a real test call
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey || !anthropicKey.startsWith('sk-ant-')) {
    harness.record({
      id: 'ENV-01',
      product: 'Environment',
      phase: 'Setup',
      testName: 'Anthropic API Key',
      status: 'FAIL',
      message: 'ANTHROPIC_API_KEY missing or wrong format (should start with sk-ant-)',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Make a real lightweight API call to verify
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say OK' }],
        }),
      });
      const data = (await res.json()) as any;
      harness.record({
        id: 'ENV-01',
        product: 'Environment',
        phase: 'Setup',
        testName: 'Anthropic API Key Live Test',
        status: data.content ? 'PASS' : 'FAIL',
        message: data.content
          ? `API key valid. Model responded: ${data.content[0]?.text}`
          : `API error: ${JSON.stringify(data)}`,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      harness.record({
        id: 'ENV-01',
        product: 'Environment',
        phase: 'Setup',
        testName: 'Anthropic API Key Live Test',
        status: 'FAIL',
        message: `Network error: ${e.message}`,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // 2. RESEND API KEY
  const resendKey = process.env.RESEND_API_KEY;
  harness.record({
    id: 'ENV-02',
    product: 'Environment',
    phase: 'Setup',
    testName: 'Resend API Key',
    status: resendKey?.startsWith('re_') ? 'PASS' : 'FAIL',
    message: resendKey?.startsWith('re_')
      ? 'Key present and correctly formatted'
      : 'RESEND_API_KEY missing or wrong format',
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  // 3. STRIPE KEY (for playbooks)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  harness.record({
    id: 'ENV-03',
    product: 'Environment',
    phase: 'Setup',
    testName: 'Stripe Secret Key',
    status: stripeKey ? 'PASS' : 'WARN',
    message: stripeKey ? 'Present' : 'STRIPE_SECRET_KEY not set — playbook payments will fail',
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  // 4. Check all required product data directories exist
  const requiredDirs = [
    '../assessment/data',
    '../assessment/data/assessments',
    '../assessment/data/reports',
    '../ai-agent/configs',
    '../dashboard/data/clients',
    '../playbooks/output',
    '../automation-templates/make/templates',
    '../automation-templates/n8n',
  ];

  for (const dir of requiredDirs) {
    const exists = fs.existsSync(dir);
    harness.record({
      id: 'ENV-DIR',
      product: 'Environment',
      phase: 'Setup',
      testName: `Directory: ${dir}`,
      status: exists ? 'PASS' : 'WARN',
      message: exists ? 'Exists' : 'Missing — will be created by product setup if needed',
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    if (!exists) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // ignore mkdir failures
      }
    }
  }
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  runEnvCheck(new QAHarness()).catch(console.error);
}
