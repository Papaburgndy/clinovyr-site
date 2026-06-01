#!/usr/bin/env npx ts-node --project tsconfig.cli.json
import { validateAllPlaybooks } from "../src/validators/playbook-validator";

function main(): void {
  const reports = validateAllPlaybooks();

  console.log("\n=== Playbook Content Validation ===\n");

  let passCount = 0;

  for (const report of reports) {
    const { result } = report;
    const status = result.valid ? "PASS" : "FAIL";
    if (result.valid) passCount += 1;

    console.log(`[${status}] ${report.slug}`);
    console.log(
      `  words: ${result.stats.wordCount} | tools: ${result.stats.toolCount} | prompts: ${result.stats.promptCount} | min sections/ch: ${result.stats.minSectionsPerChapter}`,
    );

    for (const error of result.errors) {
      console.log(`  ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  WARN: ${warning}`);
    }

    if (report.slug === "medical" && !result.valid) {
      const wordFail = result.errors.some((e) => e.includes("Word count"));
      if (wordFail) {
        console.log(
          "  NOTE: Medical word count low — regenerate with: npm run generate -- --industry Medical --version 1",
        );
      }
    }

    if (
      report.slug !== "medical" &&
      !result.valid &&
      result.stats.wordCount < 8000
    ) {
      console.log(
        "  NOTE: Regenerate full playbook: npm run generate -- --industry \"<Industry>\" --version 1",
      );
    }
  }

  console.log(`\nSummary: ${passCount}/${reports.length} passed\n`);
  process.exit(passCount === reports.length ? 0 : 1);
}

main();
