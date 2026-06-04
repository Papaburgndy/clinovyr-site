import { NextResponse } from "next/server";
import { sendPortalAssessmentNotification } from "@/lib/assessment-email";
import { mapIndustryForScoring } from "@/lib/assessment-utils";
import { requireAuthApi } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateSurveyNarrative } from "@/lib/executive-summary";
import { calculateAIReadinessScore } from "@/lib/scoring";
import { validateCompleteAssessment } from "@/lib/validate-assessment";
import type { AssessmentFormData } from "@/types/assessment";

export async function POST(request: Request) {
  const { userId, session } = await requireAuthApi();

  if (!userId || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    include: { survey: true },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Complete onboarding before submitting the assessment." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateCompleteAssessment(body);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const formData: AssessmentFormData = {
    ...result.data,
    companyName: company.name,
    industry: mapIndustryForScoring(company.industry),
  };

  const scoreResult = calculateAIReadinessScore(formData);
  const narrative = await generateSurveyNarrative(formData, scoreResult, {
    name: company.name,
    industry: company.industry,
    size: company.size,
    revenue: company.revenue,
  });

  await prisma.survey.upsert({
    where: { companyId: company.id },
    create: {
      companyId: company.id,
      status: "complete",
      responses: { step: 6, formData, completedSteps: [1, 2, 3, 4, 5, 6] },
      score: scoreResult.overallScore,
      tier: scoreResult.tier,
      topOpportunities: scoreResult.topOpportunities,
      recommendedPkg: scoreResult.recommendedPackage,
      estimatedROI: scoreResult.estimatedAnnualROI,
      executiveSummary: narrative.executiveSummary,
      biggestOpportunity: narrative.biggestOpportunity,
      readinessStatement: narrative.readinessStatement,
      nextStep: narrative.nextStep,
      completedAt: new Date(),
    },
    update: {
      status: "complete",
      responses: { step: 6, formData, completedSteps: [1, 2, 3, 4, 5, 6] },
      score: scoreResult.overallScore,
      tier: scoreResult.tier,
      topOpportunities: scoreResult.topOpportunities,
      recommendedPkg: scoreResult.recommendedPackage,
      estimatedROI: scoreResult.estimatedAnnualROI,
      executiveSummary: narrative.executiveSummary,
      biggestOpportunity: narrative.biggestOpportunity,
      readinessStatement: narrative.readinessStatement,
      nextStep: narrative.nextStep,
      completedAt: new Date(),
    },
  });

  const emailResult = await sendPortalAssessmentNotification({
    formData,
    score: scoreResult,
    userName: session.user.name ?? null,
    userEmail: session.user.email ?? "",
    companyPhone: company.phone,
  });

  if (!emailResult.ok) {
    console.warn("[survey/complete] notification email failed:", emailResult.error);
  }

  return NextResponse.json({
    success: true,
    score: scoreResult.overallScore,
    tier: scoreResult.tier,
    recommendedPkg: scoreResult.recommendedPackage,
    estimatedROI: scoreResult.estimatedAnnualROI,
    topOpportunities: scoreResult.topOpportunities,
    executiveSummary: narrative.executiveSummary,
    biggestOpportunity: narrative.biggestOpportunity,
    readinessStatement: narrative.readinessStatement,
    nextStep: narrative.nextStep,
  });
}
