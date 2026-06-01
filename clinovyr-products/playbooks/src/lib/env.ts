import fs from "fs";
import path from "path";

export function loadEnvFromLocalFiles(): void {
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", "workshop-generator", ".env.local"),
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

export function getProjectRoot(): string {
  return process.cwd();
}

export function getContentDir(): string {
  return path.join(getProjectRoot(), "content", "playbooks");
}

export function getOutputPdfDir(): string {
  return path.join(getProjectRoot(), "output", "pdfs");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
