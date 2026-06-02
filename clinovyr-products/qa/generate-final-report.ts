import * as fs from 'fs';

const report = JSON.parse(
  fs.readFileSync('./results/qa-report.json', 'utf8'),
) as {
  generatedAt: string;
  goNoGo: string;
  summary: {
    total: number;
    pass: number;
    fail: number;
    warn: number;
    passRate: number;
    elapsed: string;
  };
  deliverables: Array<{
    id: string;
    file?: string;
    size?: number;
    status: string;
  }>;
  results: Array<{
    id: string;
    testName: string;
    status: string;
    message: string;
  }>;
};

const deliverables = report.deliverables ?? [];
const failed = (report.results ?? []).filter((r) => r.status === 'FAIL');
const warnings = (report.results ?? []).filter((r) => r.status === 'WARN');

const deliverableLines =
  deliverables.length > 0
    ? deliverables.map(
        (d) =>
          `- [${d.status}] ${d.id}: \`${d.file ?? 'N/A'}\` (${
            d.size ? (d.size / 1024).toFixed(1) + 'KB' : 'N/A'
          })`,
      )
    : ['- _(none)_'];

const failLines =
  failed.length > 0
    ? failed.map(
        (r) => `- [${r.id}] ${r.testName}\n  Issue: ${r.message}`,
      )
    : ['- _(none — all critical tests passed)_'];

const warnLines =
  warnings.length > 0
    ? warnings.map(
        (r) => `- [${r.id}] ${r.testName}\n  Note: ${r.message}`,
      )
    : ['- _(none)_'];

const lines = [
  '# CLINOVYR QA FINAL REPORT',
  `Generated: ${report.generatedAt}`,
  `Overall Verdict: ${report.goNoGo}`,
  '',
  '## Summary',
  '| Metric | Value |',
  '|--------|-------|',
  `| Total Tests | ${report.summary.total} |`,
  `| Passed | ${report.summary.pass} |`,
  `| Failed | ${report.summary.fail} |`,
  `| Warnings | ${report.summary.warn} |`,
  `| Pass Rate | ${report.summary.passRate}% |`,
  `| Duration | ${report.summary.elapsed}s |`,
  '',
  '## Deliverables Generated',
  ...deliverableLines,
  '',
  '## Failed Tests (must fix before go-live)',
  ...failLines,
  '',
  '## Warnings (review before go-live)',
  ...warnLines,
  '',
  `## VERDICT: ${report.goNoGo}`,
  report.goNoGo === 'GO'
    ? 'All critical tests passed. Systems are ready for first client deployment.'
    : `${report.summary.fail} critical failure(s) must be resolved before going live.`,
];

fs.writeFileSync('./results/qa-final-report.md', lines.join('\n'));
console.log(lines.join('\n'));
console.log('\nReport saved to: qa/results/qa-final-report.md');
