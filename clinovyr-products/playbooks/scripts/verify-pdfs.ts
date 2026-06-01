#!/usr/bin/env npx ts-node --project tsconfig.cli.json
import path from "path";
import { getOutputPdfDir } from "../src/lib/env";
import {
  PDF_QA_MATRIX,
  validatePdfDirectory,
} from "../src/validators/pdf-validator";

async function main(): Promise<void> {
  const pdfDir = getOutputPdfDir();
  const results = await validatePdfDirectory(pdfDir);

  console.log("\n=== PDF Validation ===\n");
  console.log(`Directory: ${pdfDir}\n`);

  if (results.length === 0) {
    console.log("No PDFs found. Run: npm run build-pdf:all -- --version 1\n");
    process.exit(1);
  }

  let passCount = 0;

  for (const { filePath, result } of results) {
    const status = result.valid ? "PASS" : "FAIL";
    if (result.valid) passCount += 1;
    console.log(`[${status}] ${path.basename(filePath)}`);
    console.log(
      `  pages: ${result.stats.pageCount} | size: ${(result.stats.fileSizeBytes / 1024).toFixed(1)} KB`,
    );
    for (const error of result.errors) {
      console.log(`  ERROR: ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`  WARN: ${warning}`);
    }
  }

  console.log("\n--- Automated vs manual QA ---");
  console.log("Automated:", PDF_QA_MATRIX.automated.join("; "));
  console.log("Manual:", PDF_QA_MATRIX.manual.join("; "));

  console.log(`\nSummary: ${passCount}/${results.length} passed\n`);
  process.exit(passCount === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
