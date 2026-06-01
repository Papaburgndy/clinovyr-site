"use client";

import { CountUp } from "@/components/dashboard/count-up";
import { Card } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/types";

interface KpiCardsProps {
  kpis: DashboardKpis;
}

const cards = [
  {
    key: "tasksAutomated" as const,
    label: "Tasks Automated",
    prefix: "",
    suffix: "",
    decimals: 0,
  },
  {
    key: "hoursSaved" as const,
    label: "Hours Saved",
    prefix: "",
    suffix: " hrs",
    decimals: 0,
  },
  {
    key: "automationsRunning" as const,
    label: "Automations Running",
    prefix: "",
    suffix: "",
    decimals: 0,
  },
  {
    key: "roiEstimate" as const,
    label: "ROI Estimate",
    prefix: "$",
    suffix: "",
    decimals: 0,
  },
];

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            {card.label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            <CountUp
              end={kpis[card.key]}
              prefix={card.prefix}
              suffix={card.suffix}
              decimals={card.decimals}
            />
          </p>
        </Card>
      ))}
    </div>
  );
}
