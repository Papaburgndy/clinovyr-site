/**
 * Verifies real @react-pdf output exceeds 50KB for a seeded client month.
 */
import fs from "fs";
import { generateMonthlyReport } from "../src/lib/monthly-report";

async function main(): Promise<void> {
  process.env.ANTHROPIC_API_KEY = "";
  process.env.RESEND_API_KEY = "";

  const result = await generateMonthlyReport("granite-bay-dental", 5, 2026);
  const size = fs.statSync(result.pdfPath).size;

  const minBytes = 50 * 1024;
  if (size < minBytes) {
    console.error(`PDF too small: ${size} bytes (expected > 50KB)`);
    process.exit(1);
  }

  console.log(`PDF ok: ${size} bytes at ${result.pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
