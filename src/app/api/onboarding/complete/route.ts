import { auth } from "@/auth";
import { parseCompanyNotes } from "@/lib/onboarding/types";
import { companyHasProfile } from "@/lib/onboarding/validation";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company || !companyHasProfile(company)) {
    return Response.json(
      { error: "Company profile is incomplete." },
      { status: 400 },
    );
  }

  const notes = parseCompanyNotes(company.notes);

  if (!notes?.goals?.length || !notes.urgency) {
    return Response.json(
      { error: "Please complete your goals step first." },
      { status: 400 },
    );
  }

  await prisma.company.update({
    where: { userId: session.user.id },
    data: { onboardingComplete: true },
  });

  return Response.json({
    success: true,
    onboardingComplete: true,
  });
}
