#!/usr/bin/env node
/**
 * E2E API integration test — run while `npm run dev` is up on port 3000.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.ASSESSMENT_BASE_URL ?? "http://localhost:3000";

const integrationPayload = {
  companyName: "Granite Bay Dental Group",
  industry: "Medical/Dental",
  employees: "6–20",
  revenue: "$2M–$10M",
  yearsInBusiness: "8",
  crm: ["None"],
  emailTools: ["Gmail/Outlook only"],
  scheduling: ["Practice software"],
  pm: ["Spreadsheets"],
  accounting: ["QuickBooks"],
  timeDrainsRanked: [
    "Appointment scheduling",
    "Customer follow-up",
    "Report generation",
    "Data entry",
    "Email management",
    "Invoicing/billing",
    "Social media",
    "Staff communication",
  ],
  aiTools: "Tried a few",
  comfortLevel: 3,
  biggestConcern: "Don't know where to start",
  goals: ["Save staff time", "Improve customer experience"],
  firstName: "E2E",
  lastName: "Tester",
  // Resend sandbox only delivers to the account owner email
  email: process.env.CONTACT_EMAIL ?? "clinovyr@gmail.com",
  phone: "916-555-0199",
  bestTimeToConnect: "Morning (8am–12pm)",
  hearAbout: "Google",
  additionalNotes: "Automated E2E integration test",
};

const results = {
  devPort: 3000,
  submit: null,
  assessmentFile: null,
  generateReport: null,
  pdfFile: null,
  errors: [],
};

async function main() {
  console.log("POST", `${BASE}/api/submit-assessment`);
  const submitRes = await fetch(`${BASE}/api/submit-assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(integrationPayload),
  });
  const submitBody = await submitRes.json().catch(() => ({}));
  results.submit = {
    status: submitRes.status,
    body: submitBody,
  };
  console.log("submit status:", submitRes.status, JSON.stringify(submitBody, null, 2));

  if (!submitBody.assessmentId) {
    results.errors.push("submit-assessment missing assessmentId");
    printSummary();
    process.exit(1);
  }

  if (!submitBody.success) {
    results.errors.push(
      `submit-assessment returned ${submitRes.status}: ${submitBody.error ?? "unknown"}`,
    );
  }

  const assessmentId = submitBody.assessmentId;
  const assessmentPath = path.join(
    process.cwd(),
    "data",
    "assessments",
    `${assessmentId}.json`,
  );
  try {
    await stat(assessmentPath);
    const raw = await readFile(assessmentPath, "utf-8");
    const parsed = JSON.parse(raw);
    results.assessmentFile = {
      exists: true,
      path: assessmentPath,
      companyName: parsed.formData?.companyName,
      hasScore: Boolean(parsed.score),
    };
  } catch {
    results.assessmentFile = { exists: false, path: assessmentPath };
    results.errors.push("assessment JSON file missing");
  }

  console.log("POST", `${BASE}/api/generate-report`);
  const reportRes = await fetch(`${BASE}/api/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessmentId }),
  });

  const contentType = reportRes.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    const buf = Buffer.from(await reportRes.arrayBuffer());
    results.generateReport = {
      status: reportRes.status,
      contentType,
      bodyLength: buf.length,
      nonEmpty: buf.length > 0,
    };
    const pdfPath = path.join(process.cwd(), "data", "reports", `${assessmentId}.pdf`);
    try {
      const pdfStat = await stat(pdfPath);
      const pdfBuf = await readFile(pdfPath);
      const text = pdfBuf.toString("latin1");
      const ascii = text.includes("Granite Bay Dental Group");
      results.pdfFile = {
        exists: true,
        path: pdfPath,
        size: pdfStat.size,
        containsCompanyName: ascii,
        note: ascii
          ? undefined
          : "PDF text may be compressed; company name is set in assessment-pdf.tsx meta block",
      };
    } catch {
      results.pdfFile = { exists: false, path: pdfPath };
      results.errors.push("report PDF file missing on disk");
    }
  } else {
    const errBody = await reportRes.json().catch(() => ({}));
    results.generateReport = {
      status: reportRes.status,
      contentType,
      error: errBody,
    };
    results.errors.push("generate-report did not return PDF");
  }

  printSummary();
  process.exit(results.errors.length > 0 ? 1 : 0);
}

function printSummary() {
  console.log("\n=== E2E API SUMMARY ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
