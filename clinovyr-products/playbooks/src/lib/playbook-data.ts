import fs from "fs";
import path from "path";
import { getContentDir, getOutputPdfDir } from "./env";
import type { Playbook } from "./types";

export function getPlaybookJsonPath(slug: string, version: number): string {
  return path.join(getContentDir(), slug, `v${version}.json`);
}

export function getPlaybookPdfPath(slug: string, version: number): string {
  return path.join(getOutputPdfDir(), `${slug}-v${version}.pdf`);
}

export function loadPlaybook(slug: string, version: number): Playbook | null {
  const jsonPath = getPlaybookJsonPath(slug, version);
  if (!fs.existsSync(jsonPath)) return null;
  const raw = fs.readFileSync(jsonPath, "utf8");
  return JSON.parse(raw) as Playbook;
}

export function savePlaybook(
  playbook: Playbook,
  version: number,
): string {
  const dir = path.join(getContentDir(), playbook.slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const jsonPath = path.join(dir, `v${version}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(playbook, null, 2), "utf8");
  return jsonPath;
}

export function playbookExists(slug: string, version: number): boolean {
  return fs.existsSync(getPlaybookJsonPath(slug, version));
}

export function pdfExists(slug: string, version: number): boolean {
  return fs.existsSync(getPlaybookPdfPath(slug, version));
}
