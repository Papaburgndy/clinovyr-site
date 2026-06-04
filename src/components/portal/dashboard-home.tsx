import type { Company, Order, Survey } from "@prisma/client";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/portal/CheckoutButton";
import { Button } from "@/components/ui/button";
import { DeliverablesProgressBar } from "@/components/portal/deliverables-progress-bar";
import {
  formatCents,
  getDashboardState,
  parseTopOpportunities,
} from "@/lib/dashboard-state";
import { cn } from "@/lib/utils";
import { getContactEmail } from "@/lib/assessment-email";

type DashboardHomeProps = {
  userName: string | null;
  company: Company | null;
  survey: Survey | null;
  order: Order | null;
  calendlyUrl: string;
};

function PortalCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-rule/15 bg-ink/60 p-6 backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardHome({
  userName,
  company,
  survey,
  order,
  calendlyUrl,
}: DashboardHomeProps) {
  const state = getDashboardState(survey, order);
  const firstName = userName?.split(" ")[0] ?? "there";
  const opportunities = parseTopOpportunities(survey?.topOpportunities ?? null);

  return (
    <div className="space-y-8">
      {state === "A" && <StateA firstName={firstName} />}
      {state === "B" && (
        <StateB
          survey={survey}
          order={order}
          opportunities={opportunities}
        />
      )}
      {state === "C" && <StateC />}
      {state === "D" && (
        <StateD
          order={order}
          companyName={company?.name ?? null}
          calendlyUrl={calendlyUrl}
        />
      )}
    </div>
  );
}

function StateA({ firstName }: { firstName: string }) {
  return (
    <>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Welcome
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper sm:text-4xl">
          Welcome to Clinovyr, {firstName}! Your AI journey starts here.
        </h1>
      </div>
      <PortalCard>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-light text-paper">
              Step 1: Complete Your AI Readiness Survey
            </h2>
            <p className="mt-2 flex items-center gap-2 font-sans text-sm text-paper/60">
              <Clock className="h-4 w-4 text-accent-light" aria-hidden />
              About 8 minutes · personalized results
            </p>
          </div>
          <Button
            href="/dashboard/assessment"
            className="shrink-0 border border-accent/30"
          >
            Start survey
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </div>
      </PortalCard>
    </>
  );
}

function StateB({
  survey,
  order,
  opportunities,
}: {
  survey: Survey | null;
  order: Order | null;
  opportunities: ReturnType<typeof parseTopOpportunities>;
}) {
  const product =
    survey?.recommendedPkg ?? order?.product ?? "AI Readiness Assessment";
  const amount = order?.amount ?? 500_000;

  return (
    <>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Your results
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          Your AI readiness snapshot
        </h1>
      </div>

      <PortalCard>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Score
            </p>
            <p className="mt-1 font-display text-4xl text-paper">
              {survey?.score ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Tier
            </p>
            <p className="mt-1 font-display text-2xl text-accent-light">
              {survey?.tier ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Est. ROI
            </p>
            <p className="mt-1 font-sans text-sm text-paper/70">
              {survey?.estimatedROI ?? "Personalized in your roadmap"}
            </p>
          </div>
        </div>

        {opportunities.length > 0 ? (
          <div className="mt-8 border-t border-rule/15 pt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Top opportunities
            </h3>
            <ul className="mt-4 space-y-3">
              {opportunities.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 font-sans text-sm text-paper/75"
                >
                  <Sparkles
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                    aria-hidden
                  />
                  <span>
                    {item.title ?? item.name ?? `Opportunity ${i + 1}`}
                    {item.description ? (
                      <span className="block text-paper/50">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </PortalCard>

      <PortalCard className="border-accent/30">
        <h2 className="font-display text-2xl font-light text-paper">
          Your personalized AI roadmap is ready — unlock it now
        </h2>
        <p className="mt-2 font-sans text-sm text-paper/60">
          Recommended package:{" "}
          <span className="text-paper">{product}</span>
        </p>
        <p className="mt-1 font-display text-3xl text-accent-light">
          {formatCents(amount)}
        </p>
        <div className="mt-6">
          <CheckoutButton className="w-full sm:w-auto">
            Unlock with Stripe checkout
          </CheckoutButton>
        </div>
      </PortalCard>
    </>
  );
}

function StateC() {
  const contactEmail = getContactEmail();
  return (
    <>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          In progress
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          We&apos;re preparing your deliverables
        </h1>
        <p className="mt-2 font-sans text-sm text-paper/60">
          Usually ready within 24 hours. We&apos;ll email you when everything
          is in your portal.
        </p>
      </div>
      <PortalCard>
        <DeliverablesProgressBar />
        <p className="mt-6 font-sans text-sm text-paper/55">
          Questions while you wait?{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-accent-light underline-offset-4 hover:underline"
          >
            {contactEmail}
          </a>{" "}
          — we respond within one business day.
        </p>
      </PortalCard>
    </>
  );
}

function StateD({
  order,
  companyName,
  calendlyUrl,
}: {
  order: Order | null;
  companyName: string | null;
  calendlyUrl: string;
}) {
  return (
    <>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Complete
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          {companyName ? `${companyName} — ` : ""}Your deliverables are ready
        </h1>
      </div>

      <PortalCard>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Package purchased
            </dt>
            <dd className="mt-1 font-sans text-paper">{order?.product}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Status
            </dt>
            <dd className="mt-1 font-sans capitalize text-accent-light">
              {order?.status}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button href="/dashboard/deliverables" variant="primary">
            View deliverables
          </Button>
          <Button href="/dashboard/agent" variant="primary">
            Open AI agent
          </Button>
        </div>
      </PortalCard>

      <PortalCard>
        <h2 className="font-display text-xl font-light text-paper">
          What&apos;s next
        </h2>
        <p className="mt-2 font-sans text-sm text-paper/60">
          Book a kickoff call to walk through your roadmap and plan the first
          automations together.
        </p>
        <Button
          href={calendlyUrl}
          className="mt-6 border border-accent/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book kickoff call
        </Button>
      </PortalCard>
    </>
  );
}
