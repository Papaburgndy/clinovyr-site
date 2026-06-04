import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExecutiveSummarySection } from "@/components/portal/results/executive-summary";
import { LockedPreview } from "@/components/portal/results/locked-preview";
import { OpportunityCards } from "@/components/portal/results/opportunity-cards";
import { PaidStateBanner } from "@/components/portal/results/paid-state-banner";
import { PurchaseCta } from "@/components/portal/results/purchase-cta";
import { ScoreHero } from "@/components/portal/results/score-hero";
import { requireAuth } from "@/lib/auth-helpers";
import { isDeliverablesReady, isOrderPaid } from "@/lib/dashboard-state";
import { enrichTopOpportunities } from "@/lib/opportunities";
import { getPackageByRecommended } from "@/lib/packages";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Assessment Results",
  description: "Your AI Readiness Assessment results.",
};

export default async function ResultsPage() {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { survey: true, order: true },
  });

  if (!company) {
    redirect("/onboarding");
  }

  const survey = company.survey;

  if (!survey || survey.status !== "complete") {
    redirect("/dashboard/assessment");
  }

  const order = company.order;
  const isPaid = isOrderPaid(order);
  const deliverablesReady = isDeliverablesReady(order);
  const packageDetails = getPackageByRecommended(survey.recommendedPkg);
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );

  const calendlyUrl =
    process.env.CALENDLY_URL ?? "https://calendly.com/clinovyr";

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
            Results
          </p>
          <h1 className="mt-2 font-display text-3xl font-light text-paper sm:text-4xl">
            Your AI readiness results
          </h1>
          <p className="mt-3 font-sans text-sm text-paper/60">
            Personalized assessment for {company.name}.
            {survey.estimatedROI ? (
              <>
                {" "}
                Estimated annual ROI:{" "}
                <span className="text-accent-light">{survey.estimatedROI}</span>
              </>
            ) : null}
          </p>
        </header>

        <ScoreHero score={survey.score ?? 0} tier={survey.tier ?? "Developing"} />

        <OpportunityCards opportunities={opportunities} />

        <ExecutiveSummarySection
          companyName={company.name}
          summary={survey.executiveSummary}
          biggestOpportunity={survey.biggestOpportunity}
          readinessStatement={survey.readinessStatement}
          nextStep={survey.nextStep}
        />

        {isPaid ? (
          <PaidStateBanner isDeliverablesReady={deliverablesReady} />
        ) : (
          <>
            <PurchaseCta
              packageDetails={packageDetails}
              calendlyUrl={calendlyUrl}
            />
            <LockedPreview packageDetails={packageDetails} />
          </>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/dashboard"
            className="font-sans text-sm text-accent-light underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <Link
            href="/dashboard/assessment"
            className="font-sans text-sm text-paper/50 underline-offset-4 hover:text-paper/70 hover:underline"
          >
            View assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
