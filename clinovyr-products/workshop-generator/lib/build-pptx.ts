import fs from "fs";
import path from "path";
import PptxGenJS from "pptxgenjs";
import type { WorkshopOutline } from "./types";

const INK = "0D0F12";
const PAPER = "F5F2ED";
const ACCENT = "1A6B5A";
const MUTED = "7A7468";
const GOLD = "C49A3C";

const DARK_SLIDE_TYPES = new Set(["title", "agenda", "cta"]);

function isDarkSlide(type: string): boolean {
  return DARK_SLIDE_TYPES.has(type);
}

function addClinovyrFooter(slide: PptxGenJS.Slide, dark: boolean): void {
  slide.addText("Clinovyr — Intelligence, Applied.", {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 9,
    fontFace: "Arial",
    color: dark ? MUTED : MUTED,
    align: "left",
  });
}

function addTitleSlide(
  pptx: PptxGenJS,
  outline: WorkshopOutline,
  dateLabel: string,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: INK };

  slide.addText("CLINOVYR", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.4,
    fontSize: 11,
    fontFace: "Arial",
    color: ACCENT,
    bold: true,
    charSpacing: 2,
  });

  slide.addText(outline.title, {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 1.2,
    fontSize: 32,
    fontFace: "Arial",
    color: PAPER,
    bold: true,
  });

  if (outline.slides[0]?.bullets.length) {
    slide.addText(outline.slides[0].bullets.join("\n"), {
      x: 0.5,
      y: 2.8,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: "Arial",
      color: MUTED,
    });
  }

  slide.addText(dateLabel, {
    x: 0.5,
    y: 4.6,
    w: 9,
    h: 0.4,
    fontSize: 12,
    fontFace: "Arial",
    color: MUTED,
    italic: true,
  });

  addClinovyrFooter(slide, true);
}

function addContentSlide(
  pptx: PptxGenJS,
  slideData: WorkshopOutline["slides"][number],
  outline: WorkshopOutline,
): void {
  const dark = isDarkSlide(slideData.type);
  const slide = pptx.addSlide();
  slide.background = { color: dark ? INK : PAPER };

  const titleColor = dark ? PAPER : INK;
  const bodyColor = dark ? PAPER : INK;
  const subColor = dark ? MUTED : MUTED;

  if (slideData.type === "demo") {
    slide.addShape(pptx.ShapeType.rect, {
      x: 7.2,
      y: 0.35,
      w: 2.3,
      h: 0.45,
      fill: { color: GOLD },
      line: { color: GOLD },
    });
    slide.addText("LIVE DEMO", {
      x: 7.2,
      y: 0.35,
      w: 2.3,
      h: 0.45,
      fontSize: 10,
      fontFace: "Arial",
      color: INK,
      bold: true,
      align: "center",
      valign: "middle",
    });
  }

  if (slideData.type === "exercise") {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.35,
      w: 1.6,
      h: 0.45,
      fill: { color: ACCENT },
      line: { color: ACCENT },
    });
    slide.addText("⏱ [TIMER]", {
      x: 0.5,
      y: 0.35,
      w: 1.6,
      h: 0.45,
      fontSize: 10,
      fontFace: "Arial",
      color: PAPER,
      bold: true,
      align: "center",
      valign: "middle",
    });
  }

  slide.addText(slideData.title, {
    x: 0.5,
    y: slideData.type === "demo" || slideData.type === "exercise" ? 1 : 0.5,
    w: 9,
    h: 0.8,
    fontSize: 24,
    fontFace: "Arial",
    color: titleColor,
    bold: true,
  });

  if (slideData.type === "agenda") {
    const rows: PptxGenJS.TableRow[] = outline.agenda.map((item) => [
      { text: `${item.timeMinutes} min` },
      { text: item.title },
      { text: item.type.toUpperCase() },
    ]);
    slide.addTable(rows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 3.5,
      fontSize: 12,
      fontFace: "Arial",
      color: bodyColor,
      border: { type: "none" },
      fill: { color: dark ? INK : PAPER },
    });
  } else if (slideData.bullets.length > 0) {
    const bulletText = slideData.bullets.map((b) => ({
      text: b,
      options: { bullet: true, breakLine: true },
    }));
    slide.addText(bulletText, {
      x: 0.5,
      y: 1.4,
      w: 9,
      h: 3.6,
      fontSize: slideData.type === "stat" ? 20 : 16,
      fontFace: "Arial",
      color: bodyColor,
      valign: "top",
    });
  }

  if (slideData.type === "demo" && slideData.demoDescription) {
    slide.addText(slideData.demoDescription, {
      x: 0.5,
      y: 4.9,
      w: 9,
      h: 0.35,
      fontSize: 11,
      fontFace: "Arial",
      color: ACCENT,
      underline: { style: "sng" },
    });
  }

  if (slideData.type === "cta") {
    slide.addText("clinovyr.com\nclinovyr@gmail.com\nGranite Bay, CA", {
      x: 6.5,
      y: 2.2,
      w: 3,
      h: 2,
      fontSize: 12,
      fontFace: "Arial",
      color: ACCENT,
      align: "center",
      valign: "middle",
      shape: pptx.ShapeType.rect,
      fill: { color: INK },
      line: { color: MUTED, width: 1 },
    });
  }

  addClinovyrFooter(slide, dark);
}

export async function buildWorkshopPptx(
  outline: WorkshopOutline,
  outputPath: string,
  dateLabel: string,
): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Clinovyr";
  pptx.company = "Clinovyr";
  pptx.subject = outline.title;

  addTitleSlide(pptx, outline, dateLabel);

  for (const slideData of outline.slides) {
    if (slideData.type === "title") continue;
    addContentSlide(pptx, slideData, outline);
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await pptx.writeFile({ fileName: outputPath });
}
