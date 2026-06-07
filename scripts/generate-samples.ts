/**
 * Generate the full deliverable matrix — every product × every industry —
 * exactly as a customer in that industry would receive for that package.
 *
 *   OUT_DIR=/path/to/folder npx tsx scripts/generate-samples.ts
 *
 * If ANTHROPIC_API_KEY is set and reachable, Claude-powered deliverables use
 * full content; otherwise they use the built-in fallback content.
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const OUT = process.env.OUT_DIR ?? join(process.cwd(), "Deliverable-Samples");
type AnyCtx = { company: unknown; survey: unknown; formData: unknown };

const INDUSTRIES: Array<{ folder: string; name: string; company: string }> = [
  { folder: "01-Medical-and-Dental", name: "Medical & Dental", company: "Granite Bay Family Dental" },
  { folder: "02-Real-Estate", name: "Real Estate & Property", company: "Placer Realty Group" },
  { folder: "03-Legal-and-Financial", name: "Legal & Financial", company: "Stroud & Associates Law" },
  { folder: "04-Construction", name: "Construction & Contracting", company: "Sierra Construction Co" },
  { folder: "05-Wellness-and-Med-Spa", name: "Wellness & Med Spa", company: "Radiance Med Spa" },
  { folder: "06-Retail-and-Hospitality", name: "Retail & Hospitality", company: "The Fountains Boutique" },
  { folder: "07-Other-Generic", name: "Other", company: "Acme Professional Services" },
];

const PRODUCT_FOLDER: Record<string, string> = {
  "AI Opportunity Audit": "AI-Opportunity-Audit-1500",
  "AI Readiness Assessment": "AI-Readiness-Assessment-5000",
  "Workflow Automation Sprint": "Workflow-Automation-Sprint-12000",
};

function buildFormData(company: string, industry: string) {
  return {
    companyName: company, industry, employees: "6–20", revenue: "$500K–$2M", yearsInBusiness: "8",
    crm: ["HubSpot"], emailTools: ["Mailchimp"], scheduling: ["Calendly"], pm: ["Notion"], accounting: ["QuickBooks"],
    timeDrainsRanked: ["Customer follow-up", "Email management", "Data entry", "Report generation", "Appointment scheduling", "Invoicing/billing", "Social media", "Staff communication"],
    aiTools: "Tried a few", comfortLevel: 3, biggestConcern: "Don't know where to start",
    goals: ["Save staff time", "Increase revenue", "Work fewer hours"],
    firstName: "Jordan", lastName: "Avery", email: "owner@example.com", phone: "916-555-0199",
    bestTimeToConnect: "Flexible", hearAbout: "Referral", additionalNotes: "Sample generation",
  };
}
function buildCompany(name: string, industry: string) {
  return { id: `sample-${industry}`, userId: "u1", name, industry, size: "6–20", revenue: "$500K–$2M",
    website: "https://example.com", phone: "9165550199", city: "Granite Bay", state: "CA",
    notes: null, onboardingComplete: true, createdAt: new Date() };
}
function buildSurvey(companyId: string, formData: unknown) {
  return { id: `s-${companyId}`, companyId, status: "complete", responses: { formData },
    score: 62, tier: "Developing",
    topOpportunities: ["Automate customer follow-up", "Streamline scheduling", "AI review requests"],
    recommendedPkg: "Workflow Automation Sprint ($12,000)", estimatedROI: "$48,000/year",
    executiveSummary: "Your assessment shows strong potential to reclaim staff hours through targeted automation, starting with customer follow-up.",
    biggestOpportunity: "Automate customer follow-up", readinessStatement: "Ready to pilot AI in high-volume workflows.",
    nextStep: "Schedule a Clinovyr working session to confirm pilot scope.", completedAt: new Date(), createdAt: new Date() };
}

async function main() {
  const claudeLive = !!process.env.ANTHROPIC_API_KEY?.trim();
  const { CLINOVYR_PRODUCTS, getProduct } = await import("@/lib/products");
  const { resolveDeliverableGenerator } = await import("@/lib/deliverables/industry-map");

  mkdirSync(OUT, { recursive: true });
  const manifest: string[] = ["industry,product,deliverable_key,filename,type,KB,status"];
  let okCount = 0, errCount = 0;

  for (const ind of INDUSTRIES) {
    const formData = buildFormData(ind.company, ind.name);
    const company = buildCompany(ind.company, ind.name);
    const survey = buildSurvey(company.id, formData);
    const ctx: AnyCtx = { company, survey, formData };

    for (const productName of Object.keys(CLINOVYR_PRODUCTS) as Array<keyof typeof CLINOVYR_PRODUCTS>) {
      const product = getProduct(productName);
      const dir = join(OUT, ind.folder, PRODUCT_FOLDER[productName]);
      mkdirSync(dir, { recursive: true });

      for (const key of product.deliverables) {
        const generator = resolveDeliverableGenerator(key, company as never);
        if (!generator) { manifest.push(`${ind.name},${productName},${key},,,,NO_GENERATOR`); errCount++; continue; }
        try {
          const out = (await generator(ctx)) as { buffer: Buffer; filename: string; type: string } | null;
          if (!out) { manifest.push(`${ind.name},${productName},${key},,,,NULL`); errCount++; continue; }
          writeFileSync(join(dir, out.filename), out.buffer);
          manifest.push(`${ind.name},${productName},${key},${out.filename},${out.type},${Math.round(out.buffer.length / 1024)},OK`);
          okCount++;
        } catch (e) {
          manifest.push(`${ind.name},${productName},${key},,,,ERROR:${(e as Error).message.slice(0, 60)}`);
          errCount++;
        }
      }
    }
    console.log(`✓ ${ind.name}`);
  }

  writeFileSync(join(OUT, "MANIFEST.csv"), manifest.join("\n"));
  const readme = `# Clinovyr — Deliverable Samples

Generated ${new Date().toLocaleString("en-US")}.

Every folder is one **industry**; inside are the three **packages**, each containing the
exact files a customer in that industry receives when they buy that package.

| Package | Price | Folder |
|---|---|---|
| AI Opportunity Audit | $1,500 | AI-Opportunity-Audit-1500 |
| AI Readiness Assessment | $5,000 | AI-Readiness-Assessment-5000 |
| Workflow Automation Sprint | $12,000 | Workflow-Automation-Sprint-12000 |

Industries: Medical & Dental, Real Estate, Legal & Financial, Construction,
Wellness & Med Spa, Retail & Hospitality, and Other (generic).

**Content note:** these samples were generated with Claude **${claudeLive ? "ENABLED" : "in FALLBACK mode (no API access in this environment)"}**.
${claudeLive ? "" : "Claude-powered deliverables (AI reports, roadmaps, prompt libraries, opportunity brief, CRM guide, etc.) will be richer and longer in production. PDF layout, ROI spreadsheet formulas, and ZIP blueprints are identical to production."}

See MANIFEST.csv for the full list with file sizes and status.

Totals: ${okCount} files generated, ${errCount} errors.
`;
  writeFileSync(join(OUT, "README.md"), readme);
  console.log(`\nDone: ${okCount} files, ${errCount} errors → ${OUT}`);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
