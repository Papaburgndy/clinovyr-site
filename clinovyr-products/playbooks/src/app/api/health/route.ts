import { getPlaybooksHealth } from "@/lib/health";
import { NextResponse } from "next/server";

export async function GET() {
  const { body, statusCode } = getPlaybooksHealth();
  return NextResponse.json(body, { status: statusCode });
}
