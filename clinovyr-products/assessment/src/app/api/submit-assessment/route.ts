import { NextResponse } from "next/server";
import { logResendApiKeyLoaded } from "@/lib/env-check";
import { sendAssessmentEmails } from "@/lib/email";
import {
  createAssessmentId,
  saveAssessment,
  type StoredAssessment,
} from "@/lib/storage";
import { calculateAIReadinessScore } from "@/lib/scoring";
import { validateAssessmentPayload } from "@/lib/validate-assessment";

export async function POST(request: Request) {
  logResendApiKeyLoaded();

  try {
    const body: unknown = await request.json();
    const result = validateAssessmentPayload(body);

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const score = calculateAIReadinessScore(result.data);
    const assessmentId = createAssessmentId(result.data.companyName);
    const createdAt = new Date().toISOString();

    const record: StoredAssessment = {
      assessmentId,
      formData: result.data,
      score,
      createdAt,
    };

    await saveAssessment(record);

    const emailResult = await sendAssessmentEmails({
      formData: result.data,
      score,
      assessmentId,
    });

    if (!emailResult.emailSent) {
      console.warn("[submit-assessment] email incomplete:", emailResult.warnings);
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      score: score.overallScore,
      tier: score.tier,
      emailSent: emailResult.emailSent,
      ...(emailResult.warnings.length > 0 && {
        emailWarning: emailResult.warnings.join(" "),
      }),
    });
  } catch (error) {
    console.error("[submit-assessment] unexpected error:", error);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }
}
