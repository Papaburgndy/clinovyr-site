import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

export function ensureOutputDir(): string {
  const outputDir = resolve(process.cwd(), "output");
  mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

export function writeJsonFile(relativePath: string, data: unknown): string {
  const absolutePath = resolve(process.cwd(), relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  return absolutePath;
}

export function writeMarkdownFile(relativePath: string, content: string): string {
  const absolutePath = resolve(process.cwd(), relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf-8");
  return absolutePath;
}
