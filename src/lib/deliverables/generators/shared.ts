import type { GeneratorOutput } from "@/lib/deliverables/generators/types";
import type { DeliverableFileType } from "@/lib/deliverables/types";
import { DELIVERABLE_KEY_META } from "@/lib/deliverables/artifacts";

export function toBuffer(content: string | Buffer): Buffer {
  return Buffer.isBuffer(content) ? content : Buffer.from(content, "utf-8");
}

export function textOutput(
  key: string,
  content: string,
  overrides?: Partial<
    Pick<GeneratorOutput, "filename" | "mimeType" | "displayName" | "type">
  >,
): GeneratorOutput {
  const meta = DELIVERABLE_KEY_META[key];
  const buffer = toBuffer(content);
  const type = overrides?.type ?? meta?.deliverableType ?? "json";

  return {
    buffer,
    filename: overrides?.filename ?? meta?.filename ?? `${key}.txt`,
    mimeType:
      overrides?.mimeType ??
      mimeTypeForDeliverable(type, overrides?.filename ?? meta?.filename),
    displayName: overrides?.displayName ?? meta?.displayName ?? key,
    type,
  };
}

export function jsonOutput(
  key: string,
  data: unknown,
  overrides?: Partial<
    Pick<GeneratorOutput, "filename" | "displayName" | "type">
  >,
): GeneratorOutput {
  return textOutput(key, JSON.stringify(data, null, 2), {
    mimeType: "application/json; charset=utf-8",
    type: overrides?.type ?? "json",
    ...overrides,
  });
}

function mimeTypeForDeliverable(
  type: DeliverableFileType,
  filename?: string,
): string {
  if (filename?.endsWith(".html")) return "text/html; charset=utf-8";
  if (filename?.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (filename?.endsWith(".json")) return "application/json; charset=utf-8";

  switch (type) {
    case "html":
      return "text/html; charset=utf-8";
    case "markdown":
      return "text/markdown; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export function pdfOutput(
  key: string,
  buffer: Buffer,
  overrides?: Partial<
    Pick<GeneratorOutput, "filename" | "displayName" | "type">
  >,
): GeneratorOutput {
  const meta = DELIVERABLE_KEY_META[key];
  return {
    buffer,
    filename: overrides?.filename ?? meta?.filename ?? `${key}.pdf`,
    mimeType: "application/pdf",
    displayName: overrides?.displayName ?? meta?.displayName ?? key,
    type: overrides?.type ?? "pdf",
  };
}

export function spreadsheetOutput(
  key: string,
  buffer: Buffer,
  overrides?: Partial<
    Pick<GeneratorOutput, "filename" | "displayName" | "type">
  >,
): GeneratorOutput {
  const meta = DELIVERABLE_KEY_META[key];
  return {
    buffer,
    filename: overrides?.filename ?? meta?.filename ?? `${key}.xlsx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    displayName: overrides?.displayName ?? meta?.displayName ?? key,
    type: overrides?.type ?? "html",
  };
}

export function zipOutput(
  key: string,
  buffer: Buffer,
  overrides?: Partial<
    Pick<GeneratorOutput, "filename" | "displayName" | "type">
  >,
): GeneratorOutput {
  const meta = DELIVERABLE_KEY_META[key];
  return {
    buffer,
    filename: overrides?.filename ?? meta?.filename ?? `${key}.zip`,
    mimeType: "application/zip",
    displayName: overrides?.displayName ?? meta?.displayName ?? key,
    type: overrides?.type ?? "json",
  };
}

/** Build an in-memory ZIP using archiver v8 ZipArchive API. */
export async function createZipBuffer(
  files: Array<{ name: string; content: string | Buffer }>,
  options?: { compressionLevel?: number },
): Promise<Buffer> {
  const archiverMod = await import("archiver");
  const ZipArchive = (archiverMod as unknown as { ZipArchive: new (options: { zlib: { level: number } }) => { on(event: string, listener: (...args: unknown[]) => void): void; append(content: string | Buffer, opts: { name: string }): void; finalize(): Promise<void>; }; }).ZipArchive;
  const archive = new ZipArchive({
    zlib: { level: options?.compressionLevel ?? 9 },
  });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    archive.on("data", (chunk) => chunks.push(chunk as Buffer));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const file of files) {
      archive.append(file.content, { name: file.name });
    }

    void archive.finalize();
  });
}
