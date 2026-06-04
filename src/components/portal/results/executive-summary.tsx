import { ArrowRight, Sparkles, Target } from "lucide-react";

type ExecutiveSummarySectionProps = {
  companyName: string;
  summary: string | null | undefined;
  biggestOpportunity?: string | null;
  readinessStatement?: string | null;
  nextStep?: string | null;
};

export function ExecutiveSummarySection({
  companyName,
  summary,
  biggestOpportunity,
  readinessStatement,
  nextStep,
}: ExecutiveSummarySectionProps) {
  if (!summary) return null;

  const paragraphs = summary.split(/\n\n+/).filter(Boolean);
  const hasHighlights = biggestOpportunity || readinessStatement || nextStep;

  return (
    <section className="rounded-sm border border-rule/15 bg-ink/60 p-8 backdrop-blur-sm sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Executive summary
      </p>
      <h2 className="mt-2 font-display text-2xl font-light text-paper sm:text-3xl">
        What this means for {companyName}
      </h2>

      <div className="mt-5 space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="font-sans text-base leading-relaxed text-paper/70"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {hasHighlights ? (
        <dl className="mt-8 grid gap-4 border-t border-rule/15 pt-8 sm:grid-cols-3">
          {biggestOpportunity ? (
            <div className="rounded-sm border border-rule/10 bg-ink/40 p-5">
              <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-gold">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Biggest opportunity
              </dt>
              <dd className="mt-2 font-sans text-sm leading-relaxed text-paper/75">
                {biggestOpportunity}
              </dd>
            </div>
          ) : null}

          {readinessStatement ? (
            <div className="rounded-sm border border-rule/10 bg-ink/40 p-5">
              <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-accent-light">
                <Target className="h-3.5 w-3.5" aria-hidden />
                Where you stand
              </dt>
              <dd className="mt-2 font-sans text-sm leading-relaxed text-paper/75">
                {readinessStatement}
              </dd>
            </div>
          ) : null}

          {nextStep ? (
            <div className="rounded-sm border border-rule/10 bg-ink/40 p-5">
              <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-accent-light">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                Recommended next step
              </dt>
              <dd className="mt-2 font-sans text-sm leading-relaxed text-paper/75">
                {nextStep}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
