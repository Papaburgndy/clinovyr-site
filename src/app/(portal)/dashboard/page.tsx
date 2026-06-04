import type { Metadata } from "next";
import { DashboardHome } from "@/components/portal/dashboard-home";
import { ProgressStepper } from "@/components/portal/progress-stepper";
import { requireAuth } from "@/lib/auth-helpers";
import { getStepperSteps } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Clinovyr client dashboard.",
};

export default async function DashboardPage() {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { survey: true, order: true },
  });

  const steps = getStepperSteps(
    company,
    company?.survey,
    company?.order,
  );

  const calendlyUrl =
    process.env.CALENDLY_URL ?? "https://calendly.com/clinovyr";

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <ProgressStepper steps={steps} />
      <div className="mt-8 flex-1">
        <DashboardHome
          userName={session.user.name ?? null}
          company={company}
          survey={company?.survey ?? null}
          order={company?.order ?? null}
          calendlyUrl={calendlyUrl}
        />
      </div>
    </div>
  );
}
