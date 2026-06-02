import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as os from 'os';

const QA_ROOT = path.resolve(__dirname, '..');
const MAKE_ROOT = path.resolve(QA_ROOT, '../automation-templates/make');
const MAKE_TEMPLATES_DIR = path.join(MAKE_ROOT, 'templates');
const N8N_TEMPLATES_DIR = path.resolve(QA_ROOT, '../automation-templates/n8n');
const AUTOMATION_TEMPLATES_DIR = path.resolve(QA_ROOT, '../automation-templates');

export async function runPhase3(harness: QAHarness): Promise<void> {
  console.log('\n\x1b[33m── PHASE 3: AUTOMATION TEMPLATES ──\x1b[0m');

  // Manifest lives at make/templates/manifest.json (not make/manifest.json).
  const manifestPath = path.join(MAKE_TEMPLATES_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    harness.record({
      id: 'AT-MANIFEST',
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: 'Make.com manifest exists',
      status: 'FAIL',
      message: `manifest.json not found at ${manifestPath}`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const templateCount = manifest.templates?.length || 0;
    harness.record({
      id: 'AT-MANIFEST',
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: 'Make.com manifest — 8 templates catalogued',
      status: templateCount >= 8 ? 'PASS' : 'FAIL',
      message: `Found ${templateCount}/8 templates in manifest`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    for (const t of manifest.templates || []) {
      const blueprintPath = path.join(MAKE_TEMPLATES_DIR, t.file);
      const guidePath = path.join(MAKE_ROOT, t.customizationGuide);
      const fileExists = fs.existsSync(blueprintPath);
      const hasGuide =
        t.customizationGuide && fs.existsSync(guidePath);
      const hasROI = t.estimatedROI && t.estimatedROI.length > 10;

      harness.record({
        id: `AT-${t.id}`,
        product: 'Automation Templates',
        phase: 'Tier B',
        testName: `Template: ${t.name}`,
        status: fileExists && hasGuide && hasROI ? 'PASS' : fileExists ? 'WARN' : 'FAIL',
        deliverable: fileExists ? blueprintPath : undefined,
        message: [
          fileExists ? '✓ Blueprint file exists' : '✗ Blueprint file MISSING',
          hasGuide ? '✓ Setup guide exists' : '✗ Setup guide missing',
          hasROI ? '✓ ROI estimate present' : '⚠ ROI estimate missing',
        ].join(' | '),
        duration: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const n8nFiles = fs.existsSync(N8N_TEMPLATES_DIR)
    ? fs
        .readdirSync(N8N_TEMPLATES_DIR)
        .filter((f) => f.endsWith('.workflow.json'))
    : [];

  harness.record({
    id: 'AT-N8N-COUNT',
    product: 'Automation Templates',
    phase: 'Tier B',
    testName: 'n8n workflow count (expect 6)',
    status: n8nFiles.length >= 6 ? 'PASS' : 'WARN',
    message: `Found ${n8nFiles.length}/6 expected n8n workflows: ${n8nFiles.join(', ')}`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  for (const file of n8nFiles) {
    const filePath = path.join(N8N_TEMPLATES_DIR, file);
    let json: any;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e: any) {
      harness.record({
        id: `N8N-${file}`,
        product: 'Automation Templates',
        phase: 'Tier B',
        testName: `n8n JSON valid: ${file}`,
        status: 'FAIL',
        message: `Invalid JSON: ${e.message ?? e}`,
        deliverable: filePath,
        duration: 0,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const hasNodes = Array.isArray(json.nodes) && json.nodes.length > 0;
    const hasConnections =
      json.connections && Object.keys(json.connections).length > 0;
    const hasTrigger = json.nodes?.some((n: any) => {
      const type = String(n.type ?? '').toLowerCase();
      return (
        type.includes('scheduletrigger') ||
        type.includes('webhook') ||
        type.includes('trigger') ||
        type.includes('cron')
      );
    });

    harness.record({
      id: `N8N-${file}`,
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: `n8n structure: ${file}`,
      status: hasNodes && hasConnections && hasTrigger ? 'PASS' : 'WARN',
      deliverable: filePath,
      deliverableSize: fs.statSync(filePath).size,
      message: [
        hasNodes ? `✓ ${json.nodes.length} nodes` : '✗ No nodes',
        hasConnections ? '✓ Connections defined' : '✗ No connections',
        hasTrigger ? '✓ Trigger node present' : '✗ No trigger node found',
      ].join(' | '),
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }

  const validateResult = spawnSync('npm', ['run', 'validate'], {
    cwd: AUTOMATION_TEMPLATES_DIR,
    timeout: 60_000,
    stdio: 'pipe',
    env: process.env,
  });

  harness.record({
    id: 'AT-VALIDATE',
    product: 'Automation Templates',
    phase: 'Tier B',
    testName: 'npm run validate (Make + n8n)',
    status: validateResult.status === 0 ? 'PASS' : 'FAIL',
    message:
      validateResult.status === 0
        ? 'All automation templates passed validation suite'
        : (
            validateResult.stderr?.toString() ||
            validateResult.stdout?.toString() ||
            `validate exited with code ${validateResult.status ?? 'unknown'}`
          ).slice(0, 300),
    duration: 0,
    timestamp: new Date().toISOString(),
  });

  const testConfig = {
    clientId: 'qa-test-client',
    companyName: 'QA Test Company',
    crmType: 'HubSpot',
    emailProvider: 'Gmail',
    webhookUrl: 'https://webhook.site/test',
    apiKeys: {},
  };
  const configPath = path.join(os.tmpdir(), 'qa-client-config.json');
  fs.writeFileSync(configPath, JSON.stringify(testConfig));

  const wizardSource = fs.readFileSync(
    path.join(MAKE_ROOT, 'src/client-setup-wizard.ts'),
    'utf8',
  );
  const wizardSupportsConfig =
    wizardSource.includes('--config') && wizardSource.includes('--dry-run');

  if (!wizardSupportsConfig) {
    harness.record({
      id: 'AT-WIZARD',
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: 'Client setup wizard (dry run)',
      status: 'WARN',
      message:
        'client-setup-wizard.ts is interactive-only (no --config/--dry-run); running programmatic customization instead',
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    const customizeResult = spawnSync(
      'npx',
      [
        'ts-node',
        '-e',
        `const { TemplateLibrary } = require('./src/template-manager');
const lib = new TemplateLibrary('.');
lib.loadCatalog();
const result = lib.customizeTemplate('lead-followup-email', {
  companyName: 'QA Test Company',
  crmType: 'HubSpot',
  emailProvider: 'Gmail',
  webhookUrl: 'https://webhook.site/test',
  apiKeys: {},
});
if (!result.substitutions.length) process.exit(2);
console.log('substitutions:', result.substitutions.length);`,
      ],
      {
        cwd: MAKE_ROOT,
        timeout: 30_000,
        stdio: 'pipe',
        env: process.env,
      },
    );

    harness.record({
      id: 'AT-CUSTOMIZE',
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: 'Template customization (lead-followup-email)',
      status: customizeResult.status === 0 ? 'PASS' : 'FAIL',
      message:
        customizeResult.status === 0
          ? customizeResult.stdout?.toString().trim() ||
            'Template customized with substitutions applied'
          : (
              customizeResult.stderr?.toString() ||
              customizeResult.stdout?.toString() ||
              `exit code ${customizeResult.status ?? 'unknown'}`
            ).slice(0, 300),
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  } else {
    const wizardResult = spawnSync(
      'npx',
      [
        'ts-node',
        'src/client-setup-wizard.ts',
        '--config',
        configPath,
        '--dry-run',
      ],
      {
        cwd: MAKE_ROOT,
        timeout: 30_000,
        stdio: 'pipe',
        env: process.env,
      },
    );

    harness.record({
      id: 'AT-WIZARD',
      product: 'Automation Templates',
      phase: 'Tier B',
      testName: 'Client setup wizard (dry run)',
      status: wizardResult.status === 0 ? 'PASS' : 'WARN',
      message:
        wizardResult.status === 0
          ? 'Wizard completed without errors in dry-run mode'
          : (
              wizardResult.stderr?.toString() ||
              wizardResult.stdout?.toString() ||
              `exit code ${wizardResult.status ?? 'unknown'}`
            ).slice(0, 300),
      duration: 0,
      timestamp: new Date().toISOString(),
    });
  }
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase3(harness)
    .then(() => {
      const s = harness.summary();
      console.log(`\nPhase 3: Pass ${s.pass} | Fail ${s.fail} | Warn ${s.warn}`);
    })
    .catch(console.error);
}
