import { getPortalHealth } from "@/lib/health";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { body, statusCode } = await getPortalHealth();
  return NextResponse.json(body, { status: statusCode });
}
