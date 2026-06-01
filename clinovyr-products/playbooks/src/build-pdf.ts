import fs from "fs";
import path from "path";
import { renderToFile } from "@react-pdf/renderer";
import { PlaybookDocument } from "./lib/playbook-pdf";
import {
  getIndustryByKey,
  getIndustryBySlug,
  INDUSTRIES,
} from "./lib/industries";
import { loadEnvFromLocalFiles, getOutputPdfDir } from "./lib/env";
import {
  getPlaybookJsonPath,
  getPlaybookPdfPath,
  loadPlaybook,
} from "./lib/playbook-data";

function parseArgs(argv: string[]): {
  industry?: string;
  version: number;
  all: boolean;
} {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return undefined;
    return argv[idx + 1];
  };

  const industry = get("--industry");
  const versionRaw = get("--version");
  const all = argv.includes("--all");
  const version = versionRaw ? parseInt(versionRaw, 10) : 1;

  if (Number.isNaN(version) || version < 1) {
    console.error("--version must be a positive integer.");
    process.exit(1);
  }

  return { industry, version, all };
}

async function buildPdfForIndustry(
  slug: string,
  version: number,
): Promise<string> {
  const playbook = loadPlaybook(slug, version);
  if (!playbook) {
    throw new Error(
      `Playbook not found: ${getPlaybookJsonPath(slug, version)}. Run generate first.`,
    );
  }

  const outputDir = getOutputPdfDir();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pdfPath = getPlaybookPdfPath(slug, version);
  await renderToFile(
    PlaybookDocument({ playbook }),
    pdfPath,
  );

  return pdfPath;
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();
  const { industry, version, all } = parseArgs(process.argv.slice(2));

  if (all) {
    for (const config of INDUSTRIES) {
      console.log(`Building PDF: ${config.slug} v${version}...`);
      const pdfPath = await buildPdfForIndustry(config.slug, version);
      console.log(`  → ${pdfPath}`);
    }
    console.log("Done.");
    return;
  }

  if (!industry) {
    console.error(
      "Usage: npx ts-node src/build-pdf.ts --industry <slug> --version <n>\n       npx ts-node src/build-pdf.ts --all --version <n>",
    );
    process.exit(1);
  }

  const config =
    getIndustryByKey(industry) ?? getIndustryBySlug(industry);
  if (!config) {
    console.error(`Unknown industry: ${industry}`);
    process.exit(1);
  }

  console.log(`Building PDF for ${config.label} v${version}...`);
  const pdfPath = await buildPdfForIndustry(config.slug, version);
  console.log(`Done: ${pdfPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
