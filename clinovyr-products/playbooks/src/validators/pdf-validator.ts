import fs from "fs";
import path from "path";

export const MIN_PDF_PAGES = 25;
export const MIN_PDF_BYTES = 50_000;
export const MAX_PDF_BYTES = 25_000_000;

export type PdfValidationStats = {
  pageCount: number;
  fileSizeBytes: number;
  fileName: string;
};

export type PdfValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: PdfValidationStats;
};

export type ValidatePdfOptions = {
  minPages?: number;
  minBytes?: number;
  maxBytes?: number;
};

type PdfParseFn = (buffer: Buffer) => Promise<{ numpages: number; text?: string }>;

let pdfParseFn: PdfParseFn | null = null;

async function getPdfParse(): Promise<PdfParseFn> {
  if (pdfParseFn) return pdfParseFn;
  const mod = await import("pdf-parse");
  const parser = (mod.default ?? mod) as PdfParseFn;
  pdfParseFn = parser;
  return parser;
}

export async function validatePdfFile(
  filePath: string,
  options: ValidatePdfOptions = {},
): Promise<PdfValidationResult> {
  const minPages = options.minPages ?? MIN_PDF_PAGES;
  const minBytes = options.minBytes ?? MIN_PDF_BYTES;
  const maxBytes = options.maxBytes ?? MAX_PDF_BYTES;

  const errors: string[] = [];
  const warnings: string[] = [];
  const fileName = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: [`PDF not found: ${filePath}`],
      warnings: [],
      stats: { pageCount: 0, fileSizeBytes: 0, fileName },
    };
  }

  const buffer = fs.readFileSync(filePath);
  const fileSizeBytes = buffer.length;

  if (fileSizeBytes < minBytes) {
    errors.push(
      `File size ${fileSizeBytes} bytes is below minimum ${minBytes} bytes — PDF may be empty or corrupt.`,
    );
  }

  if (fileSizeBytes > maxBytes) {
    warnings.push(
      `File size ${fileSizeBytes} bytes exceeds recommended maximum ${maxBytes} bytes.`,
    );
  }

  const header = buffer.subarray(0, 5).toString("ascii");
  if (!header.startsWith("%PDF")) {
    errors.push("File does not have a valid PDF header.");
  }

  let pageCount = 0;
  let textLength = 0;

  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    pageCount = data.numpages ?? 0;
    textLength = (data.text ?? "").trim().length;
  } catch (error) {
    errors.push(
      `Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (pageCount < minPages) {
    errors.push(
      `Page count ${pageCount} is below minimum ${minPages}. Rebuild with npm run build-pdf.`,
    );
  }

  if (pageCount >= minPages && textLength < 500) {
    warnings.push(
      "Extracted text is very short — verify layout and fonts render correctly (manual visual check).",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { pageCount, fileSizeBytes, fileName },
  };
}

export async function validatePdfDirectory(
  pdfDir: string,
  options?: ValidatePdfOptions,
): Promise<Array<{ filePath: string; result: PdfValidationResult }>> {
  if (!fs.existsSync(pdfDir)) {
    return [];
  }

  const files = fs
    .readdirSync(pdfDir)
    .filter((name) => name.endsWith(".pdf"))
    .sort();

  const results: Array<{ filePath: string; result: PdfValidationResult }> = [];

  for (const name of files) {
    const filePath = path.join(pdfDir, name);
    results.push({
      filePath,
      result: await validatePdfFile(filePath, options),
    });
  }

  return results;
}

/** What PDF QA can be automated vs needs human review */
export const PDF_QA_MATRIX = {
  automated: [
    "Page count >= threshold (pdf-parse)",
    "File exists and size within bounds",
    "Valid %PDF header",
    "Extracted text length heuristic (empty/corrupt detection)",
  ],
  manual: [
    "Brand colors, typography, and Clinovyr styling",
    "Page breaks, orphans, and chapter heading hierarchy",
    "Table of contents accuracy and page numbers",
    "Images, callout boxes, and checklist formatting",
    "Footer/header consistency across industries",
  ],
} as const;
