import { auth } from "@/lib/auth";
import { getReports, resolveClientId } from "@/lib/clients";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = await resolveClientId(
    session.user.email,
    searchParams.get("clientId")
  );

  if (!clientId) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const reports = await getReports(clientId);
  return NextResponse.json(reports);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientId = await resolveClientId(
    session.user.email,
    body.clientId ?? null
  );
  const filename = body.filename as string;

  if (!clientId || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "clients",
    clientId,
    "reports",
    filename
  );

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
}
