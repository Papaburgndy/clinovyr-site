#!/usr/bin/env node
import fs from "fs";
import { generatePlaybookContent } from "./lib/claude-playbook-generator";
import { loadEnvFromLocalFiles } from "./lib/env";
import {
  getIndustryByKey,
  INDUSTRIES,
} from "./lib/industries";
import { savePlaybook } from "./lib/playbook-data";

function parseArgs(argv: string[]): {
  industry?: string;
  version: number;
  all: boolean;
  dryRun: boolean;
} {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return undefined;
    return argv[idx + 1];
  };

  const industry = get("--industry");
  const versionRaw = get("--version");
  const all = argv.includes("--all");
  const dryRun = argv.includes("--dry-run");
  const version = versionRaw ? parseInt(versionRaw, 10) : 1;

  if (Number.isNaN(version) || version < 1) {
    console.error("--version must be a positive integer.");
    process.exit(1);
  }

  return { industry, version, all, dryRun };
}

async function generateOne(
  industryKey: string,
  version: number,
  dryRun: boolean,
): Promise<void> {
  const config = getIndustryByKey(industryKey);
  if (!config) {
    throw new Error(`Unknown industry: ${industryKey}`);
  }

  console.log(
    `\n=== Generating ${config.label} playbook v${version}${dryRun ? " (dry-run)" : ""} ===`,
  );

  const playbook = await generatePlaybookContent(config, version, { dryRun });
  const jsonPath = savePlaybook(playbook, version);
  console.log(`Saved: ${jsonPath}`);
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();
  const { industry, version, all, dryRun } = parseArgs(process.argv.slice(2));

  if (!process.env.ANTHROPIC_API_KEY && !dryRun) {
    console.warn(
      "ANTHROPIC_API_KEY not set — using fallback content. Pass --dry-run explicitly to suppress this warning.",
    );
  }

  if (all) {
    for (const config of INDUSTRIES) {
      await generateOne(config.key, version, dryRun);
    }
    console.log("\nAll playbooks generated.");
    return;
  }

  if (!industry) {
    console.error(
      'Usage: npx ts-node src/generate-playbook.ts --industry "Medical" --version 1\n' +
        "       npx ts-node src/generate-playbook.ts --all --version 1\n" +
        "       Add --dry-run to use fallback content without API calls.",
    );
    process.exit(1);
  }

  await generateOne(industry, version, dryRun);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
