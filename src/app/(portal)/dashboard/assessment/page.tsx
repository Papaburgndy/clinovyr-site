import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssessmentForm } from "@/components/portal/AssessmentForm";
import { mergeSurveyResponses } from "@/lib/assessment-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { isSurveyComplete } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Assessment",
  description: "AI Readiness Assessment survey.",
};

export default async function AssessmentPage() {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { survey: true },
  });

  if (!company) {
    redirect("/onboarding");
  }

  if (isSurveyComplete(company.survey)) {
    redirect("/dashboard/results");
  }

  const { formData, step, completedSteps } = mergeSurveyResponses(
    {
      name: company.name,
      industry: company.industry,
      size: company.size,
      revenue: company.revenue,
    },
    company.survey?.responses,
  );

  const hasSavedProgress =
    company.survey != null &&
    company.survey.status === "incomplete" &&
    (step > 1 || completedSteps.length > 0);

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Assessment
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          AI Readiness Survey
        </h1>
        <p className="mt-3 font-sans text-sm text-paper/60">
          About 8 minutes · personalized score, tier, and top opportunities for{" "}
          {company.name}.
        </p>

        <div className="mt-8">
          <AssessmentForm
            initialData={formData}
            initialStep={step}
            initialCompletedSteps={completedSteps}
            companyProfile={{
              name: company.name,
              industry: company.industry,
              size: company.size,
              revenue: company.revenue,
            }}
            hasSavedProgress={hasSavedProgress}
          />
        </div>

        <p className="mt-6 text-center font-sans text-xs text-paper/40">
          Need to update company details?{" "}
          <Link
            href="/dashboard/settings"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Settings
          </Link>
        </p>
      </div>
    </div>
  );
}
