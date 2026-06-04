"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliverablesProgressBar } from "@/components/portal/deliverables-progress-bar";

type PaidStateBannerProps = {
  isDeliverablesReady: boolean;
};

export function PaidStateBanner({ isDeliverablesReady }: PaidStateBannerProps) {
  return (
    <section className="rounded-sm border border-accent/30 bg-accent/5 p-8 sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Purchase complete
      </p>
      <h2 className="mt-2 font-display text-2xl font-light text-paper">
        {isDeliverablesReady
          ? "Your deliverables are ready"
          : "Your deliverables are being prepared"}
      </h2>
      <p className="mt-3 font-sans text-sm text-paper/60">
        {isDeliverablesReady
          ? "View your full package in the deliverables portal."
          : "Usually ready within 24 hours. We'll email you when everything is in your portal."}
      </p>

      {!isDeliverablesReady ? (
        <div className="mt-6">
          <DeliverablesProgressBar />
        </div>
      ) : null}

      <Button
        href="/dashboard/deliverables"
        className="mt-6 border border-accent/30"
      >
        View deliverables
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
      </Button>

      <p className="mt-4">
        <Link
          href="/dashboard"
          className="font-sans text-sm text-accent-light underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </p>
    </section>
  );
}
