import { QAHarness } from './harness';
import { runEnvCheck } from './phases/phase0-env-check';
import { runPhase1 } from './phases/phase1-assessment';
import { runPhase2 } from './phases/phase2-workshop';
import { runPhase3 } from './phases/phase3-automations';
import { runPhase4 } from './phases/phase4-agent';
import { runPhase5 } from './phases/phase5-dashboard';
import { runPhase6 } from './phases/phase6-playbooks';

async function main() {
  const harness = new QAHarness();
  console.log('\n\x1b[36m═══ CLINOVYR FULL QA RUN ═══\x1b[0m\n');

  await runEnvCheck(harness);

  const phases = [runPhase1, runPhase2, runPhase3, runPhase4, runPhase5, runPhase6];
  for (const phase of phases) {
    await phase(harness);
  }

  const report = harness.writeReport('./results/qa-report.json');
  console.log(`\n\x1b[36m═══ QA COMPLETE ═══\x1b[0m`);
  console.log(`Pass: ${report.summary.pass} | Fail: ${report.summary.fail} | Warn: ${report.summary.warn}`);
  console.log(`Pass Rate: ${report.summary.passRate}%`);
  console.log(`\x1b[${report.goNoGo === 'GO' ? '32' : '31'}m\nVERDICT: ${report.goNoGo}\x1b[0m\n`);
}

main().catch(console.error);
