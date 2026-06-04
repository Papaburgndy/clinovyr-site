import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_FORM_DATA,
  TIME_DRAINS,
  type AssessmentFormData,
  type SurveyResponsesPayload,
} from "@/types/assessment";

function normalizeFormData(input: Partial<AssessmentFormData>): AssessmentFormData {
  return {
    ...INITIAL_FORM_DATA,
    ...input,
    timeDrainsRanked:
      Array.isArray(input.timeDrainsRanked) &&
      input.timeDrainsRanked.length === TIME_DRAINS.length
        ? input.timeDrainsRanked
        : [...TIME_DRAINS],
    crm: Array.isArray(input.crm) ? input.crm : [],
    emailTools: Array.isArray(input.emailTools) ? input.emailTools : [],
    scheduling: Array.isArray(input.scheduling) ? input.scheduling : [],
    pm: Array.isArray(input.pm) ? input.pm : [],
    accounting: Array.isArray(input.accounting) ? input.accounting : [],
    goals: Array.isArray(input.goals) ? input.goals : [],
    comfortLevel:
      typeof input.comfortLevel === "number" ? input.comfortLevel : null,
    additionalNotes: input.additionalNotes ?? "",
  };
}

export async function POST(request: Request) {
  const { userId } = await requireAuthApi();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Complete onboarding before starting the assessment." },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const step = typeof body.step === "number" ? body.step : 1;
  const formData = normalizeFormData(
    (body.formData ?? {}) as Partial<AssessmentFormData>,
  );
  const completedSteps = Array.isArray(body.completedSteps)
    ? body.completedSteps.filter((n): n is number => typeof n === "number")
    : [];

  const responses: SurveyResponsesPayload = {
    step,
    formData,
    completedSteps,
  };

  await prisma.survey.upsert({
    where: { companyId: company.id },
    create: {
      companyId: company.id,
      status: "incomplete",
      responses,
    },
    update: {
      status: "incomplete",
      responses,
    },
  });

  return NextResponse.json({ saved: true });
}
