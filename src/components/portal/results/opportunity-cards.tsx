import { Clock, Sparkles, TrendingUp } from "lucide-react";
import type { EnrichedOpportunity } from "@/lib/opportunities";

type OpportunityCardsProps = {
  opportunities: EnrichedOpportunity[];
};

export function OpportunityCards({ opportunities }: OpportunityCardsProps) {
  if (opportunities.length === 0) return null;

  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Top opportunities
      </p>
      <h2 className="mt-2 font-display text-2xl font-light text-paper sm:text-3xl">
        Your top 3 AI opportunities
      </h2>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {opportunities.map((opp, index) => (
          <article
            key={`${opp.name}-${index}`}
            className="flex flex-col rounded-sm border border-rule/15 bg-ink/60 p-6 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <Sparkles
                className="mt-0.5 h-5 w-5 shrink-0 text-gold"
                aria-hidden
              />
              <h3 className="font-display text-lg text-paper">{opp.name}</h3>
            </div>
            <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-paper/65">
              {opp.description}
            </p>
            <dl className="mt-5 space-y-2 border-t border-rule/15 pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-paper/40" aria-hidden />
                <dt className="sr-only">Time to implement</dt>
                <dd className="font-mono text-[10px] uppercase tracking-wider text-paper/50">
                  {opp.timeToImplement}
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-paper/40" aria-hidden />
                <dt className="sr-only">ROI range</dt>
                <dd className="font-sans text-sm text-accent-light">
                  {opp.roiRange}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
