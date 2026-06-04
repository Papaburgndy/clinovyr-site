import { prisma } from "@/lib/prisma";
import { companyHasProfile } from "@/lib/onboarding/validation";

export async function getCompanySessionFlags(userId: string) {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: {
      name: true,
      industry: true,
      size: true,
      revenue: true,
      city: true,
      onboardingComplete: true,
    },
  });

  return {
    onboardingComplete: company?.onboardingComplete ?? false,
    hasCompanyProfile: company ? companyHasProfile(company) : false,
  };
}
