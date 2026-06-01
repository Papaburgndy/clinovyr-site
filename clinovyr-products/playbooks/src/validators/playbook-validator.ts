import fs from "fs";
import path from "path";
import { getContentDir } from "@/lib/env";
import { INDUSTRIES } from "@/lib/industries";
import type { Playbook } from "@/lib/types";

export const MIN_WORD_COUNT = 8000;
export const MIN_SECTIONS_PER_CHAPTER = 2;
export const MIN_TOOL_DIRECTORY = 8;
export const MIN_PROMPT_LIBRARY = 10;

const PLACEHOLDER_PATTERNS: Array<{ id: string; regex: RegExp }> = [
  { id: "INSERT", regex: /\[INSERT\]/i },
  { id: "TBD", regex: /\bTBD\b/i },
  { id: "LOREM", regex: /lorem\s+ipsum/i },
  { id: "HANDLEBARS_PLACEHOLDER", regex: /\{\{PLACEHOLDER\}\}/i },
  { id: "TODO_BRACKET", regex: /\[TODO\]/i },
  { id: "COMING_SOON", regex: /coming\s+soon/i },
  { id: "FIXME", regex: /\bFIXME\b/i },
  { id: "YOUR_.*_HERE", regex: /your\s+\w+\s+here/i },
];

export type PlaybookValidationStats = {
  wordCount: number;
  chapterCount: number;
  toolCount: number;
  promptCount: number;
  minSectionsPerChapter: number;
};

export type PlaybookValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: PlaybookValidationStats;
};

export type ValidatePlaybookOptions = {
  minWordCount?: number;
  minSectionsPerChapter?: number;
  minTools?: number;
  minPrompts?: number;
  /** Scan prompt-library template brackets like [PRACTICE_NAME] for placeholders */
  strictPromptTemplates?: boolean;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function collectPlaybookText(playbook: Playbook): string {
  const parts: string[] = [playbook.title, playbook.industry];

  for (const chapter of playbook.chapters ?? []) {
    parts.push(chapter.title);
    for (const section of chapter.sections ?? []) {
      parts.push(section.title, section.content);
      parts.push(...(section.callouts ?? []));
    }
  }

  for (const tool of playbook.toolDirectory ?? []) {
    parts.push(tool.name, tool.useCase, tool.priceRange, tool.url, tool.difficulty);
  }

  for (const entry of playbook.promptLibrary ?? []) {
    parts.push(entry.title, entry.prompt, entry.useCase);
  }

  if (playbook.roiCalculator) {
    parts.push(
      ...playbook.roiCalculator.inputs,
      playbook.roiCalculator.formula,
      playbook.roiCalculator.exampleOutput,
    );
  }

  for (const page of playbook.checklistPages ?? []) {
    parts.push(page.title, ...(page.items ?? []));
  }

  return parts.join(" ");
}

function findPlaceholders(
  text: string,
  context: string,
  errors: string[],
): void {
  for (const { id, regex } of PLACEHOLDER_PATTERNS) {
    if (regex.test(text)) {
      errors.push(`Placeholder detected (${id}) in ${context}`);
    }
  }
}

function isRealisticPriceRange(priceRange: string): boolean {
  const normalized = priceRange.trim().toLowerCase();
  if (!normalized) return false;

  if (
    normalized.includes("custom") ||
    normalized.includes("contact") ||
    normalized.includes("enterprise") ||
    normalized.includes("percentage")
  ) {
    return true;
  }

  if (/free/i.test(normalized)) return true;

  const numbers = normalized.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) {
    return /\$|usd|month|year|per\s/i.test(normalized);
  }

  for (const raw of numbers) {
    const value = parseFloat(raw.replace(/,/g, ""));
    if (Number.isNaN(value)) continue;
    if (value > 50000) return false;
  }

  return true;
}

function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePlaybook(
  json: unknown,
  options: ValidatePlaybookOptions = {},
): PlaybookValidationResult {
  const minWordCount = options.minWordCount ?? MIN_WORD_COUNT;
  const minSectionsPerChapter =
    options.minSectionsPerChapter ?? MIN_SECTIONS_PER_CHAPTER;
  const minTools = options.minTools ?? MIN_TOOL_DIRECTORY;
  const minPrompts = options.minPrompts ?? MIN_PROMPT_LIBRARY;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!json || typeof json !== "object") {
    return {
      valid: false,
      errors: ["Playbook must be a JSON object."],
      warnings: [],
      stats: {
        wordCount: 0,
        chapterCount: 0,
        toolCount: 0,
        promptCount: 0,
        minSectionsPerChapter: 0,
      },
    };
  }

  const playbook = json as Playbook;
  const fullText = collectPlaybookText(playbook);
  const wordCount = countWords(fullText);
  const chapterCount = playbook.chapters?.length ?? 0;
  const toolCount = playbook.toolDirectory?.length ?? 0;
  const promptCount = playbook.promptLibrary?.length ?? 0;

  let minSectionsPerChapterActual = Infinity;
  for (const chapter of playbook.chapters ?? []) {
    const sectionCount = chapter.sections?.length ?? 0;
    minSectionsPerChapterActual = Math.min(
      minSectionsPerChapterActual,
      sectionCount,
    );
    if (sectionCount < minSectionsPerChapter) {
      errors.push(
        `Chapter ${chapter.number} "${chapter.title}" has ${sectionCount} section(s); need >= ${minSectionsPerChapter}.`,
      );
    }
    for (const section of chapter.sections ?? []) {
      findPlaceholders(
        `${section.title} ${section.content} ${(section.callouts ?? []).join(" ")}`,
        `chapter ${chapter.number} section "${section.title}"`,
        errors,
      );
    }
  }

  if (minSectionsPerChapterActual === Infinity) {
    minSectionsPerChapterActual = 0;
  }

  if (wordCount < minWordCount) {
    errors.push(
      `Word count ${wordCount} is below minimum ${minWordCount}. Regenerate with Claude (npm run generate).`,
    );
  }

  if (toolCount < minTools) {
    errors.push(
      `toolDirectory has ${toolCount} tool(s); need >= ${minTools}.`,
    );
  }

  if (promptCount < minPrompts) {
    errors.push(
      `promptLibrary has ${promptCount} prompt(s); need >= ${minPrompts}.`,
    );
  }

  for (const tool of playbook.toolDirectory ?? []) {
    if (!isRealisticPriceRange(tool.priceRange ?? "")) {
      errors.push(
        `Tool "${tool.name}" has unrealistic or missing priceRange: "${tool.priceRange}".`,
      );
    }
    if (!isHttpsUrl(tool.url ?? "")) {
      errors.push(`Tool "${tool.name}" URL must start with https://: "${tool.url}".`);
    }
    findPlaceholders(
      `${tool.name} ${tool.useCase} ${tool.priceRange}`,
      `tool "${tool.name}"`,
      errors,
    );
  }

  for (const entry of playbook.promptLibrary ?? []) {
    if (options.strictPromptTemplates) {
      findPlaceholders(
        `${entry.title} ${entry.prompt} ${entry.useCase}`,
        `prompt "${entry.title}"`,
        errors,
      );
    } else {
      findPlaceholders(entry.title + " " + entry.useCase, `prompt "${entry.title}"`, errors);
    }
  }

  if (!playbook.slug) {
    warnings.push("Missing slug field.");
  }

  const stats: PlaybookValidationStats = {
    wordCount,
    chapterCount,
    toolCount,
    promptCount,
    minSectionsPerChapter: minSectionsPerChapterActual,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

export type IndustryValidationReport = {
  slug: string;
  path: string;
  result: PlaybookValidationResult;
};

export function validateAllPlaybooks(
  contentDir: string = getContentDir(),
  version = 1,
  options?: ValidatePlaybookOptions,
): IndustryValidationReport[] {
  const reports: IndustryValidationReport[] = [];

  for (const industry of INDUSTRIES) {
    const jsonPath = path.join(contentDir, industry.slug, `v${version}.json`);
    if (!fs.existsSync(jsonPath)) {
      reports.push({
        slug: industry.slug,
        path: jsonPath,
        result: {
          valid: false,
          errors: [`File not found: ${jsonPath}`],
          warnings: [],
          stats: {
            wordCount: 0,
            chapterCount: 0,
            toolCount: 0,
            promptCount: 0,
            minSectionsPerChapter: 0,
          },
        },
      });
      continue;
    }

    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    reports.push({
      slug: industry.slug,
      path: jsonPath,
      result: validatePlaybook(parsed, options),
    });
  }

  return reports;
}
