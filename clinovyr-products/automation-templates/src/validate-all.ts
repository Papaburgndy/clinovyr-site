import * as path from "path";
import { validateAllMakeBlueprints } from "./validators/make-validator";
import { validateAllN8nWorkflows } from "./validators/n8n-validator";

const ROOT = path.resolve(__dirname, "..");
const N8N_DIR = path.join(ROOT, "n8n");
const MAKE_DIR = path.join(ROOT, "make", "templates");

function printSection(title: string, results: Array<{ filename: string; valid: boolean; errors: string[] }>): {
  passed: number;
  failed: number;
} {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.valid) {
      passed++;
      console.log(`  ✓ ${result.filename}`);
    } else {
      failed++;
      console.log(`  ✗ ${result.filename}`);
      for (const error of result.errors) {
        console.log(`      - ${error}`);
      }
    }
  }

  console.log(`\n  ${passed} passed, ${failed} failed (${results.length} total)`);
  return { passed, failed };
}

function main(): void {
  console.log("Clinovyr Automation Template Validation\n");

  const n8nResults = validateAllN8nWorkflows(N8N_DIR);
  const makeResults = validateAllMakeBlueprints(MAKE_DIR);

  const n8n = printSection("n8n workflows", n8nResults);
  const make = printSection("Make.com blueprints", makeResults);

  const totalPassed = n8n.passed + make.passed;
  const totalFailed = n8n.failed + make.failed;

  console.log("\nOverall");
  console.log("=======");
  console.log(`  ${totalPassed} passed, ${totalFailed} failed (${totalPassed + totalFailed} templates)`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
