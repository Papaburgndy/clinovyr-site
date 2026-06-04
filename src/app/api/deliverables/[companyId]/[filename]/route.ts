import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import { readDeliverableFile } from "@/lib/deliverables/storage";
import { prisma } from "@/lib/prisma";

/**
 * Serves locally stored deliverable bytes (dev fallback).
 * Portal downloads should use GET /api/deliverables/download?key=… which
 * returns signed/blob URLs and logs DeliverableDownload events.
 */
export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  json: "application/json",
  md: "text/markdown; charset=utf-8",
  html: "text/html; charset=utf-8",
};

function contentTypeForFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

type RouteParams = {
  params: Promise<{ companyId: string; filename: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { userId } = await requireAuthApi();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId, filename } = await params;
  const decodedFilename = decodeURIComponent(filename);

  const company = await prisma.company.findFirst({
    where: { id: companyId, userId },
    include: { order: true },
  });

  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paid =
    company.order?.status === "paid" ||
    company.order?.status === "delivered";

  if (!paid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readDeliverableFile(companyId, decodedFilename);

  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForFilename(decodedFilename),
      "Content-Disposition": `inline; filename="${decodedFilename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
