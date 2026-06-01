export type PlaybookSection = {
  title: string;
  content: string;
  callouts: string[];
};

export type PlaybookChapter = {
  number: number;
  title: string;
  sections: PlaybookSection[];
};

export type ToolDirectoryEntry = {
  name: string;
  useCase: string;
  priceRange: string;
  url: string;
  difficulty: string;
};

export type PromptLibraryEntry = {
  title: string;
  prompt: string;
  useCase: string;
};

export type RoiCalculator = {
  inputs: string[];
  formula: string;
  exampleOutput: string;
};

export type ChecklistPage = {
  title: string;
  items: string[];
};

export type Playbook = {
  title: string;
  industry: string;
  slug: string;
  version: string;
  publishDate: string;
  chapters: PlaybookChapter[];
  toolDirectory: ToolDirectoryEntry[];
  promptLibrary: PromptLibraryEntry[];
  roiCalculator: RoiCalculator;
  checklistPages: ChecklistPage[];
};

export type IndustryConfig = {
  key: string;
  label: string;
  slug: string;
  titleSuffix: string;
  audience: string;
};

export const CHAPTER_TITLES = [
  "Why AI Now",
  "The 7 Highest-ROI AI Use Cases",
  "Tool-by-Tool Implementation Guide",
  "Your 90-Day AI Implementation Roadmap",
  "Measuring Success: KPIs and ROI Tracking",
  "Staff Training and Change Management",
  "Resources, Tools, and Next Steps",
] as const;

export const PLAYBOOK_PRICE_CENTS = 49700;
