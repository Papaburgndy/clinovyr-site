interface TestResult {
  id: string;          // e.g. "A1-assessment-form"
  product: string;     // e.g. "AI Readiness Assessment"
  phase: string;       // e.g. "Tier A — Discovery"
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  deliverable?: string;  // path to generated file if applicable
  deliverableSize?: number;  // bytes
  message: string;     // human-readable result
  duration: number;    // milliseconds
  timestamp: string;
}

class QAHarness {
  private results: TestResult[] = [];
  private startTime = Date.now();

  record(result: TestResult) {
    this.results.push(result);
    const icon = { PASS: '✓', FAIL: '✗', WARN: '⚠', SKIP: '○' }[result.status];
    const color = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m', SKIP: '\x1b[90m' }[result.status];
    console.log(`${color}${icon}\x1b[0m [${result.id}] ${result.testName} — ${result.message}`);
  }

  summary() {
    const pass = this.results.filter(r => r.status === 'PASS').length;
    const fail = this.results.filter(r => r.status === 'FAIL').length;
    const warn = this.results.filter(r => r.status === 'WARN').length;
    const total = this.results.length;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    return { pass, fail, warn, total, elapsed, passRate: Math.round((pass/total)*100) };
  }

  writeReport(path: string) {
    const s = this.summary();
    const report = {
      generatedAt: new Date().toISOString(),
      summary: s,
      goNoGo: s.fail === 0 ? 'GO' : 'NO-GO',
      results: this.results,
      deliverables: this.results
        .filter(r => r.deliverable)
        .map(r => ({ id: r.id, file: r.deliverable, size: r.deliverableSize, status: r.status }))
    };
    require('fs').writeFileSync(path, JSON.stringify(report, null, 2));
    return report;
  }
}

export { QAHarness, TestResult };
