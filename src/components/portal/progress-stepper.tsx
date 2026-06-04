import { Check } from "lucide-react";
import type { StepperStep } from "@/lib/dashboard-state";
import { cn } from "@/lib/utils";

export function ProgressStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <nav
      aria-label="Your progress"
      className="w-full overflow-x-auto rounded-sm border border-rule/15 bg-ink/60 p-4 backdrop-blur-sm"
    >
      <ol className="flex min-w-[520px] items-center justify-between gap-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px]",
                  step.complete
                    ? "border-accent bg-accent text-paper"
                    : "border-rule/30 bg-transparent text-paper/40",
                )}
                aria-hidden="true"
              >
                {step.complete ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-paper/25" />
                )}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.08em]",
                  step.complete ? "text-accent-light" : "text-paper/45",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  step.complete && steps[index + 1]?.complete
                    ? "bg-accent/60"
                    : "bg-rule/20",
                )}
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
