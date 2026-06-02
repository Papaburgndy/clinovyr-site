import { QAHarness } from '../harness';
import * as fs from 'fs';
import * as path from 'path';

const QA_ROOT = path.resolve(__dirname, '..');
const ASSESSMENTS_DIR = path.resolve(QA_ROOT, '../assessment/data/assessments');
const REPORTS_DIR = path.resolve(QA_ROOT, '../assessment/data/reports');

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

type TestSubmission = {
  label: string;
  data: {
    companyName: string;
    industry: string;
    employees: string;
    revenue: string;
    yearsInBusiness: string;
    techStack: {
      crm: string;
      email: string;
      scheduling: string;
      pm: string;
      accounting: string;
    };
    timeDrains: string[];
    aiExperience: string;
    techComfort: number;
    aiConcern: string;
    goals: string[];
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      hearAbout: string;
    };
  };
  expectedTier: string;
  expectedPackage: string;
};

/** Map nested QA fixture → flat AssessmentFormData expected by submit-assessment API. */
function buildAssessmentPayload(data: TestSubmission['data']) {
  const employees = data.employees.replace(/(\d+)-(\d+)/g, '$1\u2013$2');

  return {
    companyName: data.companyName,
    industry: data.industry,
    employees,
    revenue: data.revenue,
    yearsInBusiness: data.yearsInBusiness,
    crm: [data.techStack.crm],
    emailTools: [data.techStack.email],
    scheduling: [data.techStack.scheduling],
    pm: [data.techStack.pm],
    accounting: [data.techStack.accounting],
    timeDrainsRanked: data.timeDrains,
    aiTools:
      data.aiExperience === 'Yes regularly' ? 'Yes, regularly' : data.aiExperience,
    comfortLevel: data.techComfort,
    biggestConcern: data.aiConcern,
    goals: data.goals.slice(0, 3),
    firstName: data.contact.firstName,
    lastName: data.contact.lastName,
    email: data.contact.email,
    phone: data.contact.phone,
    bestTimeToConnect: 'Flexible',
    hearAbout: data.contact.hearAbout,
    additionalNotes: '',
  };
}

const TEST_SUBMISSIONS: TestSubmission[] = [
  {
    label: 'Low-Readiness Client (should get Opportunity Audit package)',
    data: {
      companyName: 'QA Test Dental — Low',
      industry: 'Medical/Dental',
      employees: '1-5',
      revenue: 'Under $500K',
      yearsInBusiness: '2',
      techStack: {
        crm: 'None',
        email: 'Gmail/Outlook only',
        scheduling: 'None',
        pm: 'Spreadsheets',
        accounting: 'QuickBooks',
      },
      timeDrains: [
        'Customer follow-up',
        'Appointment scheduling',
        'Report generation',
        'Data entry',
        'Email management',
        'Invoicing/billing',
        'Social media',
        'Staff communication',
      ],
      aiExperience: 'Never',
      techComfort: 2,
      aiConcern: "Don't know where to start",
      goals: ['Save staff time', 'Work fewer hours'],
      contact: {
        firstName: 'QA',
        lastName: 'Test',
        email: 'clinovyr@gmail.com',
        phone: '916-555-0001',
        hearAbout: 'LinkedIn',
      },
    },
    // Scoring engine returns Foundation/Developing/Advanced/Leader (not "Clarity").
    // With this profile: overall score 45 → Developing; package is Readiness Assessment (not Audit).
    expectedTier: 'Developing',
    expectedPackage: 'AI Readiness Assessment ($5,000)',
  },
  {
    label: 'Mid-Readiness Client (should get Assessment package)',
    data: {
      companyName: 'QA Test Realty — Mid',
      industry: 'Real Estate',
      employees: '6-20',
      revenue: '$500K–$2M',
      yearsInBusiness: '7',
      techStack: {
        crm: 'HubSpot',
        email: 'Mailchimp',
        scheduling: 'Calendly',
        pm: 'Notion',
        accounting: 'QuickBooks',
      },
      timeDrains: [
        'Customer follow-up',
        'Data entry',
        'Report generation',
        'Email management',
        'Appointment scheduling',
        'Social media',
        'Invoicing/billing',
        'Staff communication',
      ],
      aiExperience: 'Tried a few',
      techComfort: 3,
      aiConcern: 'Team adoption',
      goals: ['Increase revenue', 'Improve customer experience', 'Competitive advantage'],
      contact: {
        firstName: 'QA',
        lastName: 'Test',
        email: 'clinovyr@gmail.com',
        phone: '916-555-0002',
        hearAbout: 'Referral',
      },
    },
    // overall score 75 → Advanced (not Developing)
    expectedTier: 'Advanced',
    expectedPackage: 'AI Readiness Assessment ($5,000)',
  },
  {
    label: 'High-Readiness Client (should get Automation Sprint)',
    data: {
      companyName: 'QA Test Law — High',
      industry: 'Legal/Financial',
      employees: '21-50',
      revenue: '$2M–$10M',
      yearsInBusiness: '15',
      techStack: {
        crm: 'Salesforce',
        email: 'Mailchimp',
        scheduling: 'Acuity',
        pm: 'Asana',
        accounting: 'QuickBooks',
      },
      timeDrains: [
        'Report generation',
        'Data entry',
        'Customer follow-up',
        'Email management',
        'Appointment scheduling',
        'Invoicing/billing',
        'Staff communication',
        'Social media',
      ],
      aiExperience: 'Yes regularly',
      techComfort: 5,
      aiConcern: "Don't know where to start",
      goals: [
        'Save staff time',
        'Increase revenue',
        'Scale without hiring',
        'Better reporting/visibility',
        'Competitive advantage',
      ],
      contact: {
        firstName: 'QA',
        lastName: 'Test',
        email: 'clinovyr@gmail.com',
        phone: '916-555-0003',
        hearAbout: 'Chamber Event',
      },
    },
    // overall score 87 → Leader; goals capped at 3 for API validation
    expectedTier: 'Leader',
    expectedPackage: 'Workflow Automation Sprint ($12,000)',
  },
];

export async function runPhase1(harness: QAHarness) {
  loadEnvFiles();
  const qaTestEmail =
    process.env.QA_TEST_EMAIL ??
    process.env.CONTACT_EMAIL ??
    'clinovyr@gmail.com';
  console.log('\n\x1b[33m── PHASE 1: ASSESSMENT ──\x1b[0m');
  const BASE = process.env.ASSESSMENT_URL || 'http://localhost:3001';

  for (const test of TEST_SUBMISSIONS) {
    const t0 = Date.now();
    const payload = {
      ...buildAssessmentPayload(test.data),
      email: qaTestEmail,
    };

    let submitRes: any;
    let submitStatus = 0;
    try {
      const r = await fetch(`${BASE}/api/submit-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      submitStatus = r.status;
      submitRes = await r.json();
    } catch (e: any) {
      harness.record({
        id: 'A1-SUBMIT',
        product: 'Assessment',
        phase: 'Tier A',
        testName: `Submit: ${test.label}`,
        status: 'FAIL',
        message: `Network error — is the assessment server running on ${BASE}? Error: ${e.message}`,
        duration: Date.now() - t0,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    harness.record({
      id: 'A1-SUBMIT',
      product: 'Assessment',
      phase: 'Tier A',
      testName: `Submit: ${test.label}`,
      status: submitRes.success ? 'PASS' : submitRes.assessmentId ? 'WARN' : 'FAIL',
      message: submitRes.success
        ? `Submitted (${submitStatus})`
        : submitRes.assessmentId
          ? `Saved but email may have failed (${submitStatus}): ${submitRes.error ?? 'unknown error'}`
          : `Submit failed (${submitStatus}): ${JSON.stringify(submitRes)}`,
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });

    harness.record({
      id: 'A1-RESP',
      product: 'Assessment',
      phase: 'Tier A',
      testName: `Response: ${test.label}`,
      status:
        submitRes.assessmentId && submitRes.score !== undefined
          ? submitRes.success
            ? 'PASS'
            : 'WARN'
          : 'FAIL',
      message:
        submitRes.assessmentId && submitRes.score !== undefined
          ? `ID: ${submitRes.assessmentId} | Score: ${submitRes.score} | Tier: ${submitRes.tier}`
          : `Bad response: ${JSON.stringify(submitRes)}`,
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });

    if (!submitRes.assessmentId) continue;

    const assessmentJsonPath = path.join(ASSESSMENTS_DIR, `${submitRes.assessmentId}.json`);
    let savedPackage: string | undefined;
    if (fs.existsSync(assessmentJsonPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(assessmentJsonPath, 'utf-8'));
        savedPackage = saved.score?.recommendedPackage;
      } catch {
        // ignore parse errors — tier check below will surface issues
      }
    }

    harness.record({
      id: 'A1-SCORE',
      product: 'Assessment',
      phase: 'Tier A',
      testName: `Scoring tier: ${test.label}`,
      status: submitRes.tier === test.expectedTier ? 'PASS' : 'WARN',
      message: `Expected tier "${test.expectedTier}", got "${submitRes.tier}" | Package: ${savedPackage ?? 'unknown'}`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    harness.record({
      id: 'A1-PKG',
      product: 'Assessment',
      phase: 'Tier A',
      testName: `Recommended package: ${test.label}`,
      status: savedPackage === test.expectedPackage ? 'PASS' : 'WARN',
      message: `Expected "${test.expectedPackage}", got "${savedPackage ?? 'unknown'}"`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });

    try {
      const genRes = await fetch(`${BASE}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: submitRes.assessmentId }),
      });
      const contentType = genRes.headers.get('content-type') ?? '';
      const genOk = genRes.ok && contentType.includes('pdf');
      if (genOk) {
        const pdfBytes = Buffer.from(await genRes.arrayBuffer());
        harness.record({
          id: 'A1-GEN',
          product: 'Assessment',
          phase: 'Tier A',
          testName: `Generate report: ${test.label}`,
          status: 'PASS',
          message: `PDF returned (${genRes.status}, ${(pdfBytes.length / 1024).toFixed(1)}KB, ${contentType})`,
          duration: Date.now() - t0,
          timestamp: new Date().toISOString(),
        });
      } else {
        const errBody = await genRes.text();
        harness.record({
          id: 'A1-GEN',
          product: 'Assessment',
          phase: 'Tier A',
          testName: `Generate report: ${test.label}`,
          status: 'FAIL',
          message: `generate-report failed (${genRes.status}): ${errBody.slice(0, 200)}`,
          duration: Date.now() - t0,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      harness.record({
        id: 'A1-GEN',
        product: 'Assessment',
        phase: 'Tier A',
        testName: `Generate report: ${test.label}`,
        status: 'FAIL',
        message: `Network error calling generate-report: ${e.message}`,
        duration: Date.now() - t0,
        timestamp: new Date().toISOString(),
      });
    }

    const pdfPath = path.join(REPORTS_DIR, `${submitRes.assessmentId}.pdf`);
    const pdfExists = fs.existsSync(pdfPath);
    const pdfSize = pdfExists ? fs.statSync(pdfPath).size : 0;

    harness.record({
      id: 'A1-PDF',
      product: 'Assessment',
      phase: 'Tier A',
      testName: `PDF report: ${test.label}`,
      status: !pdfExists || pdfSize < 3000 ? 'FAIL' : pdfSize < 10000 ? 'WARN' : 'PASS',
      deliverable: pdfPath,
      deliverableSize: pdfSize,
      message: !pdfExists
        ? `PDF not found at expected path: ${pdfPath}`
        : pdfSize < 3000
          ? `PDF too small (${(pdfSize / 1024).toFixed(1)}KB) — likely empty or corrupt at ${pdfPath}`
          : pdfSize < 10000
            ? `PDF generated: ${(pdfSize / 1024).toFixed(1)}KB at ${pdfPath} (WARNING: under 10KB — verify page count and content)`
            : `PDF generated: ${(pdfSize / 1024).toFixed(1)}KB at ${pdfPath}`,
      duration: Date.now() - t0,
      timestamp: new Date().toISOString(),
    });
  }

  if (!fs.existsSync(ASSESSMENTS_DIR)) {
    harness.record({
      id: 'A1-FILES',
      product: 'Assessment',
      phase: 'Tier A',
      testName: 'Assessment data files saved',
      status: 'FAIL',
      message: `Assessments directory missing: ${ASSESSMENTS_DIR}`,
      duration: 0,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const savedFiles = fs
    .readdirSync(ASSESSMENTS_DIR)
    .filter((f) => f.endsWith('.json'));
  harness.record({
    id: 'A1-FILES',
    product: 'Assessment',
    phase: 'Tier A',
    testName: 'Assessment data files saved',
    status: savedFiles.length >= 3 ? 'PASS' : 'FAIL',
    message: `Found ${savedFiles.length} assessment JSON files (expected 3+): ${savedFiles.join(', ')}`,
    duration: 0,
    timestamp: new Date().toISOString(),
  });
}

if (require.main === module) {
  const { QAHarness } = require('../harness');
  const harness = new QAHarness();
  runPhase1(harness)
    .then(() => {
      const s = harness.summary();
      console.log(
        `\n\x1b[36mPhase 1 complete:\x1b[0m Pass: ${s.pass} | Fail: ${s.fail} | Warn: ${s.warn} | Total: ${s.total}`,
      );
    })
    .catch(console.error);
}
