import { getAssessmentHealth } from "@/lib/health";
import { NextResponse } from "next/server";

export async function GET() {
  const { body, statusCode } = getAssessmentHealth();
  return NextResponse.json(body, { status: statusCode });
}
