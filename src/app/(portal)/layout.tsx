import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { PortalChrome } from "@/components/portal/portal-chrome";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getInitials,
  getPlanBadgeLabel,
  isOrderPaid,
} from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { survey: true, order: true },
  });

  const calendlyUrl =
    process.env.CALENDLY_URL ?? "https://calendly.com/clinovyr";

  return (
    <AuthSessionProvider>
      <PortalChrome
        userName={session.user.name ?? null}
        companyName={company?.name ?? null}
        planBadge={getPlanBadgeLabel(company?.survey, company?.order)}
        initials={getInitials(session.user.name)}
        isPaid={isOrderPaid(company?.order)}
        calendlyUrl={calendlyUrl}
      >
        {children}
      </PortalChrome>
    </AuthSessionProvider>
  );
}
