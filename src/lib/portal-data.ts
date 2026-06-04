import { requireAuth } from "@/lib/auth-helpers";
import { isOrderPaid } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

export async function getPortalCompany() {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { survey: true, order: true },
  });

  return { session, company, isPaid: isOrderPaid(company?.order) };
}
