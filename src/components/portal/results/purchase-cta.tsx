import { ArrowRight, Calendar } from "lucide-react";
import { CheckoutButton } from "@/components/portal/CheckoutButton";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/dashboard-state";
import type { PackageDetails } from "@/lib/packages";

type PurchaseCtaProps = {
  packageDetails: PackageDetails;
  calendlyUrl: string;
};

export function PurchaseCta({ packageDetails, calendlyUrl }: PurchaseCtaProps) {
  return (
    <section className="rounded-sm border border-accent/30 bg-accent/5 p-8 sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
        Recommended next step
      </p>
      <h2 className="mt-2 font-display text-2xl font-light text-paper sm:text-3xl">
        {packageDetails.name}
      </h2>
      <p className="mt-2 font-display text-3xl text-accent-light">
        {formatCents(packageDetails.priceCents)}
      </p>

      <ul className="mt-6 space-y-3">
        {packageDetails.bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex gap-3 font-sans text-sm text-paper/70"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light" />
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <CheckoutButton className="border border-accent/30">
          <>
            Unlock My {packageDetails.name}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </>
        </CheckoutButton>
        <Button
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          className="border border-rule/30 bg-transparent text-paper hover:bg-paper/5"
        >
          <Calendar className="mr-2 h-4 w-4" aria-hidden />
          Book a Free Call First
        </Button>
      </div>

      <p className="mt-6 font-sans text-xs text-paper/45">
        💳 Secure payment via Stripe. Instant access after purchase.
      </p>
    </section>
  );
}
