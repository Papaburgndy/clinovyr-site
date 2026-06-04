import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  label: string;
  date: Date | null;
  complete: boolean;
};

export function AdminTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-0 border-l border-white/10 pl-6">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <li
            key={event.id}
            className={cn("relative pb-6", isLast && "pb-0")}
          >
            <span
              className={cn(
                "absolute -left-[1.55rem] flex h-6 w-6 items-center justify-center rounded-full border bg-[#0a0c0f]",
                event.complete
                  ? "border-emerald-500/60 text-emerald-400"
                  : "border-white/20 text-muted",
              )}
            >
              {event.complete ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {event.label}
            </p>
            <p className="mt-0.5 text-sm text-paper/80">
              {event.date
                ? event.date.toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Pending"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function buildCompanyTimeline(company: {
  createdAt: Date;
  survey: { status: string; completedAt: Date | null } | null;
  order: {
    status: string;
    paidAt: Date | null;
    deliveredAt: Date | null;
  } | null;
}): TimelineEvent[] {
  const surveyDone = company.survey?.status === "complete";
  const paid =
    company.order?.status === "paid" ||
    company.order?.status === "delivered";
  const delivered = company.order?.status === "delivered";

  return [
    {
      id: "created",
      label: "Account created",
      date: company.createdAt,
      complete: true,
    },
    {
      id: "survey",
      label: "Survey completed",
      date: company.survey?.completedAt ?? null,
      complete: Boolean(surveyDone),
    },
    {
      id: "payment",
      label: "Payment received",
      date: company.order?.paidAt ?? null,
      complete: Boolean(paid),
    },
    {
      id: "delivered",
      label: "Deliverables delivered",
      date: company.order?.deliveredAt ?? null,
      complete: Boolean(delivered),
    },
  ];
}
