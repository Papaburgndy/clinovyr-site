import type Anthropic from "@anthropic-ai/sdk";
import { callClaudeJson, createClaudeClient } from "./claude-client";
import { ClaudeQueue } from "./claude-queue";
import type { IndustryConfig } from "./types";
import {
  buildPlaybookTitle,
  chapterTitleForIndustry,
} from "./industries";
import { buildFallbackPlaybook } from "./fallback-playbook";
import type {
  ChecklistPage,
  Playbook,
  PlaybookChapter,
  PromptLibraryEntry,
  RoiCalculator,
  ToolDirectoryEntry,
} from "./types";
import { todayIsoDate } from "./env";
import { CHAPTER_TITLES } from "./types";

function brandContext(): string {
  return `You are a senior AI implementation consultant at Clinovyr, an AI consulting firm serving small and mid-size businesses in Placer County, California (Granite Bay / Roseville). Write practical, compliance-aware, ROI-focused content — sophisticated and actionable, never hype-driven.`;
}

function chapterPrompt(
  industry: IndustryConfig,
  chapterNumber: number,
  chapterTitle: string,
): string {
  const instructions: Record<number, string> = {
    1: `Chapter 1: "${chapterTitle}". Explain why ${industry.audience} should adopt AI now. Cover market pressure, staffing constraints, competitive dynamics in Placer County / Sacramento region, and realistic expectations. Include 3 sections with 2-3 callouts each (tips or warnings).`,
    2: `Chapter 2: "${chapterTitle}". Detail exactly 7 high-ROI AI use cases customized for ${industry.label}. Each use case should appear as a section with implementation notes. Include callouts for compliance, privacy, or workflow gotchas where relevant.`,
    3: `Chapter 3: "${chapterTitle}". Provide a tool-by-tool guide: intake automation, documentation, scheduling, follow-ups, reporting. Reference free-tier and paid tools where appropriate. 4-5 sections with actionable steps.`,
    4: `Chapter 4: "${chapterTitle}". A week-by-week 90-day rollout plan (Days 1-30, 31-60, 61-90). Include milestones, owner roles, and risk mitigation. 3 sections minimum.`,
    5: `Chapter 5: "${chapterTitle}". Define KPIs, baseline metrics, ROI tracking methods, and reporting cadence for ${industry.label}. Include example dashboards and review meetings.`,
    6: `Chapter 6: "${chapterTitle}". Change management for ${industry.audience}: training plans, SOP updates, resistance handling, and safe-use policies. Include HIPAA/ethics/compliance notes if applicable.`,
    7: `Chapter 7: "${chapterTitle}". Curated resources, vendor evaluation checklist, Clinovyr next steps (Assessment, Automation Sprint, Retainer), and 30/60/90 day action summary.`,
  };

  return `${brandContext()}

Industry: ${industry.label}
Audience: ${industry.audience}

${instructions[chapterNumber]}

Return ONLY valid JSON matching this schema:
{
  "number": ${chapterNumber},
  "title": "${chapterTitle}",
  "sections": [
    {
      "title": "string",
      "content": "string (2-4 paragraphs, plain text with line breaks ok)",
      "callouts": ["string tip or warning", "..."]
    }
  ]
}`;
}

async function generateChapter(
  client: Anthropic,
  industry: IndustryConfig,
  chapterNumber: number,
): Promise<PlaybookChapter> {
  const baseTitle = CHAPTER_TITLES[chapterNumber - 1];
  const chapterTitle = chapterTitleForIndustry(baseTitle, industry);
  const prompt = chapterPrompt(industry, chapterNumber, chapterTitle);
  return callClaudeJson<PlaybookChapter>(client, prompt);
}

async function generateToolDirectory(
  client: Anthropic,
  industry: IndustryConfig,
): Promise<ToolDirectoryEntry[]> {
  const prompt = `${brandContext()}

Create a tool directory of 10-12 AI and automation tools relevant to ${industry.label}.
Include mix of free and paid. Real URLs. Difficulty: Beginner | Intermediate | Advanced.

Return ONLY a JSON array:
[{ "name": "string", "useCase": "string", "priceRange": "string", "url": "string", "difficulty": "string" }]`;

  return callClaudeJson<ToolDirectoryEntry[]>(client, prompt);
}

async function generatePromptLibrary(
  client: Anthropic,
  industry: IndustryConfig,
): Promise<PromptLibraryEntry[]> {
  const prompt = `${brandContext()}

Create 10 ready-to-use AI prompts for ${industry.label} teams. Each prompt should be copy-paste ready with bracket placeholders.

Return ONLY a JSON array:
[{ "title": "string", "prompt": "string", "useCase": "string" }]`;

  return callClaudeJson<PromptLibraryEntry[]>(client, prompt);
}

async function generateRoiCalculator(
  client: Anthropic,
  industry: IndustryConfig,
): Promise<RoiCalculator> {
  const prompt = `${brandContext()}

Create an ROI calculator framework for ${industry.label} AI implementations.

Return ONLY JSON:
{
  "inputs": ["list of input fields staff would fill in"],
  "formula": "plain-text formula explanation",
  "exampleOutput": "worked example with realistic numbers for a Placer County SMB"
}`;

  return callClaudeJson<RoiCalculator>(client, prompt);
}

async function generateChecklistPages(
  client: Anthropic,
  industry: IndustryConfig,
): Promise<ChecklistPage[]> {
  const prompt = `${brandContext()}

Create 3 checklist pages for ${industry.label} AI rollout:
1. Pre-implementation readiness
2. 90-day implementation milestones
3. Ongoing optimization & governance

Each checklist should have 10-15 actionable items.

Return ONLY a JSON array:
[{ "title": "string", "items": ["string", "..."] }]`;

  return callClaudeJson<ChecklistPage[]>(client, prompt);
}

export async function generatePlaybookContent(
  industry: IndustryConfig,
  version: number,
  options: { dryRun?: boolean } = {},
): Promise<Playbook> {
  const client = options.dryRun ? null : createClaudeClient();

  if (!client) {
    console.warn(
      `[generate] Using fallback playbook for ${industry.label} (no API key or dry-run).`,
    );
    return buildFallbackPlaybook(industry, version);
  }

  console.log(`[generate] Generating ${industry.label} playbook v${version} via Claude...`);

  const queue = new ClaudeQueue({ concurrency: 1 });

  const chapters: PlaybookChapter[] = [];
  for (let i = 1; i <= 7; i++) {
    console.log(`  Chapter ${i}/7...`);
    chapters.push(
      await queue.enqueue(() => generateChapter(client, industry, i)),
    );
  }

  console.log("  Tool directory...");
  const toolDirectory = await queue.enqueue(() =>
    generateToolDirectory(client, industry),
  );

  console.log("  Prompt library...");
  const promptLibrary = await queue.enqueue(() =>
    generatePromptLibrary(client, industry),
  );

  console.log("  ROI calculator...");
  const roiCalculator = await queue.enqueue(() =>
    generateRoiCalculator(client, industry),
  );

  console.log("  Checklist pages...");
  const checklistPages = await queue.enqueue(() =>
    generateChecklistPages(client, industry),
  );

  return {
    title: buildPlaybookTitle(industry),
    industry: industry.label,
    slug: industry.slug,
    version: `${version}.0`,
    publishDate: todayIsoDate(),
    chapters,
    toolDirectory,
    promptLibrary,
    roiCalculator,
    checklistPages,
  };
}

