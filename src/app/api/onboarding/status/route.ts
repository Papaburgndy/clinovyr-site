import { auth } from "@/auth";
import { parseCompanyNotes } from "@/lib/onboarding/types";
import { companyHasProfile } from "@/lib/onboarding/validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    return Response.json({
      hasCompany: false,
      hasGoals: false,
      onboardingComplete: false,
      company: null,
      notes: null,
    });
  }

  const notes = parseCompanyNotes(company.notes);

  return Response.json({
    hasCompany: companyHasProfile(company),
    hasGoals: Boolean(notes?.goals?.length && notes.urgency),
    onboardingComplete: company.onboardingComplete,
    company: {
      name: company.name,
      industry: company.industry,
      size: company.size,
      revenue: company.revenue,
      city: company.city,
      state: company.state,
      phone: company.phone,
      website: company.website,
    },
    notes,
  });
}
