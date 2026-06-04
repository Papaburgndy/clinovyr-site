import { auth } from "@/auth";
import { validateSaveCompanyBody } from "@/lib/onboarding/validation";
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

  const validated = validateSaveCompanyBody(body);

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const { data } = validated;

  const company = await prisma.company.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...data,
    },
    update: data,
  });

  return Response.json({
    success: true,
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size: company.size,
      revenue: company.revenue,
      city: company.city,
      state: company.state,
      phone: company.phone,
      website: company.website,
    },
    hasCompanyProfile: true,
  });
}
