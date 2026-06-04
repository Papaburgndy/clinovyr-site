import { put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getSiteUrl } from "@/lib/stripe";

const DELIVERABLES_ROOT = path.join(process.cwd(), "data", "deliverables");

export function getDeliverablesDir(companyId: string): string {
  return path.join(DELIVERABLES_ROOT, companyId);
}

export function getDeliverablePublicUrl(
  companyId: string,
  filename: string,
): string {
  const base = getSiteUrl();
  return `${base}/api/deliverables/${companyId}/${encodeURIComponent(filename)}`;
}

export async function writeDeliverableFile(
  companyId: string,
  filename: string,
  content: string | Buffer,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const dir = getDeliverablesDir(companyId);
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    await writeFile(filePath, content);
    return { ok: true, path: filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    console.error("[deliverables/storage] write failed:", message);
    return { ok: false, error: message };
  }
}

export async function readDeliverableFile(
  companyId: string,
  filename: string,
): Promise<Buffer | null> {
  try {
    const filePath = path.join(getDeliverablesDir(companyId), filename);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export type UploadDeliverableResult =
  | { ok: true; url: string; size: number; storage: "blob" | "local" }
  | { ok: false; error: string };

/**
 * Upload deliverable to Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * Falls back to local filesystem (data/deliverables/) for dev without a token.
 *
 * Note: Production runs on Cloudflare Workers (see DEPLOYMENT.md). Vercel Blob
 * works for local/staging; a future R2 migration may be needed for edge deploys.
 */
export async function uploadDeliverable(
  companyId: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<UploadDeliverableResult> {
  const safeFilename = sanitizeFilename(filename);
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (blobToken) {
    try {
      const blob = await put(
        `deliverables/${companyId}/${safeFilename}`,
        buffer,
        {
          access: "public",
          contentType,
          token: blobToken,
        },
      );
      return {
        ok: true,
        url: blob.url,
        size: buffer.byteLength,
        storage: "blob",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Blob upload failed";
      console.error("[deliverables/storage] blob upload failed:", message);
      return { ok: false, error: message };
    }
  }

  console.info(
    "[deliverables/storage] BLOB_READ_WRITE_TOKEN missing — using local filesystem",
  );

  const writeResult = await writeDeliverableFile(
    companyId,
    safeFilename,
    buffer,
  );

  if (!writeResult.ok) {
    return { ok: false, error: writeResult.error };
  }

  return {
    ok: true,
    url: getDeliverablePublicUrl(companyId, safeFilename),
    size: buffer.byteLength,
    storage: "local",
  };
}
