import fs from "fs";
import { NextResponse } from "next/server";
import { getPlaybookPdfPath } from "@/lib/playbook-data";
import { getStripe } from "@/lib/stripe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "session_id is required." },
      { status: 400 },
    );
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed." },
        { status: 403 },
      );
    }

    const industrySlug = session.metadata?.industry;
    const version = parseInt(session.metadata?.version ?? "1", 10);

    if (!industrySlug) {
      return NextResponse.json(
        { error: "Invalid session metadata." },
        { status: 400 },
      );
    }

    const pdfPath = getPlaybookPdfPath(industrySlug, version);
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json(
        { error: "Playbook PDF not found." },
        { status: 404 },
      );
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${industrySlug}-playbook-v${version}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[playbook-download]", error);
    return NextResponse.json(
      { error: "Download failed." },
      { status: 500 },
    );
  }
}
