import { FileText, Lock, Workflow } from "lucide-react";
import type { PackageDetails } from "@/lib/packages";

type LockedPreviewProps = {
  packageDetails: PackageDetails;
};

const PREVIEW_ICONS = [FileText, Workflow, FileText] as const;

export function LockedPreview({ packageDetails }: LockedPreviewProps) {
  return (
    <section className="relative overflow-hidden rounded-sm border border-rule/15">
      <div className="pointer-events-none select-none blur-sm">
        <div className="grid gap-4 bg-ink/60 p-8 sm:grid-cols-3">
          {packageDetails.deliverables.map((item, index) => {
            const Icon = PREVIEW_ICONS[index % PREVIEW_ICONS.length];
            return (
              <div
                key={item}
                className="rounded-sm border border-rule/15 bg-ink/80 p-5"
              >
                <Icon className="h-8 w-8 text-accent-light/60" aria-hidden />
                <p className="mt-3 font-sans text-sm text-paper/70">{item}</p>
                <div className="mt-4 h-2 w-full rounded-sm bg-rule/20" />
                <div className="mt-2 h-2 w-3/4 rounded-sm bg-rule/15" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/50 px-6 text-center backdrop-blur-[2px]">
        <Lock className="h-8 w-8 text-paper/50" aria-hidden />
        <p className="mt-3 font-display text-lg text-paper">
          Unlock to access your full deliverable package
        </p>
        <p className="mt-2 max-w-sm font-sans text-sm text-paper/55">
          PDF reports, automation templates, and implementation guides included
          with {packageDetails.name}.
        </p>
      </div>
    </section>
  );
}
