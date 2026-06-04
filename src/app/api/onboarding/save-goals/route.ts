import { auth } from "@/auth";
import type { CompanyOnboardingNotes } from "@/lib/onboarding/types";
import { validateSaveGoalsBody } from "@/lib/onboarding/validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validated = validateSaveGoalsBody(body);

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return Response.json(
      { error: "Complete your company profile first." },
      { status: 400 },
    );
  }

  const notes: CompanyOnboardingNotes = {
    goals: validated.goals,
    urgency: validated.urgency,
    goalsSavedAt: new Date().toISOString(),
  };

  await prisma.company.update({
    where: { userId: session.user.id },
    data: { notes },
  });

  return Response.json({ success: true, notes });
}
