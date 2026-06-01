import fs from "fs";
import path from "path";
import type { WorkshopInput, WorkshopOutline } from "./types";

export function buildSpeakerGuide(
  outline: WorkshopOutline,
  input: WorkshopInput,
): string {
  const lines: string[] = [
    `# ${outline.title}`,
    "",
    "**Facilitator guide** — Clinovyr workshop",
    "",
    `- **Company:** ${input.company}`,
    `- **Industry:** ${input.industry}`,
    `- **Audience:** ${input.audience}`,
    `- **Duration:** ${input.durationMinutes} minutes`,
    "",
    "## Agenda",
    "",
    "| Minutes | Segment | Type |",
    "|--------:|---------|------|",
  ];

  for (const item of outline.agenda) {
    lines.push(`| ${item.timeMinutes} | ${item.title} | ${item.type} |`);
  }

  const agendaTotal = outline.agenda.reduce((sum, a) => sum + a.timeMinutes, 0);
  lines.push("", `*Total scheduled: ${agendaTotal} minutes*`, "");
  lines.push("---", "", "## Slide-by-slide speaker notes", "");

  for (const slide of outline.slides) {
    lines.push(`### Slide ${slide.slideNumber}: ${slide.title}`, "");
    lines.push(`- **Type:** ${slide.type}`);
    if (slide.demoDescription) {
      lines.push(`- **Demo:** ${slide.demoDescription}`);
    }
    lines.push("");
    if (slide.bullets.length > 0) {
      lines.push("**On-slide bullets:**");
      for (const bullet of slide.bullets) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
    lines.push("**Speaker notes:**");
    lines.push("");
    lines.push(slide.speakerNotes);
    lines.push("");
    lines.push("---", "");
  }

  lines.push(
    "",
    "## Closing reminders",
    "",
    "- Collect questions during Q&A; offer Clinovyr AI Readiness Assessment as a next step.",
    "- Contact: hello@clinovyr.com | https://clinovyr.com",
    "",
  );

  return lines.join("\n");
}

export function writeSpeakerGuide(
  outline: WorkshopOutline,
  input: WorkshopInput,
  outputPath: string,
): void {
  const content = buildSpeakerGuide(outline, input);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, content, "utf8");
}
