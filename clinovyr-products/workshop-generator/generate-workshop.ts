#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { generateWorkshopOutline } from "./lib/claude-outline";
import { buildWorkshopPptx } from "./lib/build-pptx";
import { writeSpeakerGuide } from "./lib/build-guide";
import type { WorkshopInput } from "./lib/types";

function loadEnvFromLocalFiles(): void {
  const candidates = [
    path.join(__dirname, ".env.local"),
    path.join(process.cwd(), ".env.local"),
    path.join(__dirname, "..", "..", ".env.local"),
    path.join(process.cwd(), "..", "..", ".env.local"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): WorkshopInput {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx + 1 >= argv.length) return undefined;
    return argv[idx + 1];
  };

  const industry = get("--industry");
  const company = get("--company");
  const audience = get("--audience");
  const durationRaw = get("--duration");

  if (!industry || !company || !audience) {
    console.error(
      "Usage: npx ts-node generate-workshop.ts --industry <industry> --company <company> --audience <audience> [--duration <minutes>]",
    );
    process.exit(1);
  }

  const durationMinutes = durationRaw ? parseInt(durationRaw, 10) : 90;
  if (Number.isNaN(durationMinutes) || durationMinutes < 30) {
    console.error("--duration must be a number of minutes (minimum 30).");
    process.exit(1);
  }

  return { industry, company, audience, durationMinutes };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();

  const input = parseArgs(process.argv.slice(2));
  const date = todayIsoDate();
  const slug = slugify(input.company);
  const baseName = `${slug}-${date}-workshop`;

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const pptxPath = path.join(outputDir, `${baseName}.pptx`);
  const guidePath = path.join(outputDir, `${baseName}-guide.md`);

  console.log(
    `Generating workshop for ${input.company} (${input.industry}, ${input.durationMinutes} min)...`,
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "ANTHROPIC_API_KEY not set — using built-in fallback outline (dry-run).",
    );
  }

  const outline = await generateWorkshopOutline(input);

  await buildWorkshopPptx(outline, pptxPath);
  writeSpeakerGuide(outline, input, guidePath);

  console.log("Done.");
  console.log(`  Deck:  ${pptxPath}`);
  console.log(`  Guide: ${guidePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
