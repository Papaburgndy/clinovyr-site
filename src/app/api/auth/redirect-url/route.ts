import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { onboardingComplete: true },
  });

  return Response.json({
    url: company?.onboardingComplete ? "/dashboard" : "/onboarding",
  });
}
