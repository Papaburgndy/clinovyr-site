import fs from "fs";
import path from "path";
import {
  MIN_PROMPT_LIBRARY,
  MIN_TOOL_DIRECTORY,
  MIN_WORD_COUNT,
  validateAllPlaybooks,
  validatePlaybook,
} from "@/validators/playbook-validator";

const CONTENT_DIR = path.join(process.cwd(), "content", "playbooks");

describe("validatePlaybook", () => {
  it("passes a minimal valid structure when thresholds are lowered", () => {
    const result = validatePlaybook(
      {
        title: "Test",
        industry: "Test",
        slug: "test",
        version: "1",
        publishDate: "2026-01-01",
        chapters: [
          {
            number: 1,
            title: "One",
            sections: [
              { title: "A", content: "word ".repeat(5000), callouts: [] },
              { title: "B", content: "word ".repeat(5000), callouts: [] },
            ],
          },
        ],
        toolDirectory: Array.from({ length: MIN_TOOL_DIRECTORY }, (_, i) => ({
          name: `Tool ${i}`,
          useCase: "Test",
          priceRange: "$10/month",
          url: "https://example.com",
          difficulty: "Beginner",
        })),
        promptLibrary: Array.from({ length: MIN_PROMPT_LIBRARY }, (_, i) => ({
          title: `Prompt ${i}`,
          prompt: "Do something useful.",
          useCase: "Testing",
        })),
        roiCalculator: {
          inputs: ["hours"],
          formula: "hours * rate",
          exampleOutput: "100",
        },
        checklistPages: [{ title: "Check", items: ["item"] }],
      },
      { minWordCount: 8000 },
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.wordCount).toBeGreaterThanOrEqual(MIN_WORD_COUNT);
  });

  it("flags placeholders and bad URLs", () => {
    const result = validatePlaybook({
      title: "Bad",
      industry: "Bad",
      slug: "bad",
      version: "1",
      publishDate: "2026-01-01",
      chapters: [
        {
          number: 1,
          title: "One",
          sections: [
            {
              title: "A",
              content: "Lorem ipsum filler",
              callouts: ["[INSERT] more text"],
            },
            { title: "B", content: "ok", callouts: [] },
          ],
        },
      ],
      toolDirectory: [
        {
          name: "Bad Tool",
          useCase: "x",
          priceRange: "$999999/month",
          url: "http://insecure.com",
          difficulty: "Beginner",
        },
      ],
      promptLibrary: [],
      roiCalculator: { inputs: [], formula: "", exampleOutput: "" },
      checklistPages: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /LOREM/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /INSERT/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /https/i.test(e))).toBe(true);
  });
});

describe("validateAllPlaybooks", () => {
  it("loads all five industry playbooks from content dir", () => {
    const reports = validateAllPlaybooks(CONTENT_DIR, 1);
    expect(reports).toHaveLength(5);
    for (const report of reports) {
      expect(fs.existsSync(report.path)).toBe(true);
    }
  });

  it("medical playbook meets production thresholds", () => {
    const medicalPath = path.join(CONTENT_DIR, "medical", "v1.json");
    const raw = JSON.parse(fs.readFileSync(medicalPath, "utf8"));
    const result = validatePlaybook(raw);

    expect(result.stats.wordCount).toBeGreaterThanOrEqual(MIN_WORD_COUNT);
    expect(result.stats.toolCount).toBeGreaterThanOrEqual(MIN_TOOL_DIRECTORY);
    expect(result.stats.promptCount).toBeGreaterThanOrEqual(MIN_PROMPT_LIBRARY);
    expect(result.valid).toBe(true);
  });
});
