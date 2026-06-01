import { getDashboardHealth } from "@/lib/health";
import { NextResponse } from "next/server";

export async function GET() {
  const { body, statusCode } = getDashboardHealth();
  return NextResponse.json(body, { status: statusCode });
}
