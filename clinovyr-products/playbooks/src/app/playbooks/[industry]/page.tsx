import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PurchaseButton } from "@/components/purchase-button";
import { getIndustryBySlug, INDUSTRIES, buildPlaybookTitle } from "@/lib/industries";
import { loadPlaybook } from "@/lib/playbook-data";
import { formatPlaybookPrice } from "@/lib/stripe";

type PageProps = {
  params: Promise<{ industry: string }>;
};

export async function generateStaticParams() {
  return INDUSTRIES.map((industry) => ({ industry: industry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry: slug } = await params;
  const config = getIndustryBySlug(slug);
  if (!config) return { title: "Playbook | Clinovyr" };

  return {
    title: `${config.label} AI Playbook | Clinovyr`,
    description: `Purchase the AI Implementation Playbook for ${config.titleSuffix}. ${formatPlaybookPrice()} one-time.`,
  };
}

export default async function PlaybookSalesPage({ params }: PageProps) {
  const { industry: slug } = await params;
  const config = getIndustryBySlug(slug);
  if (!config) notFound();

  const playbook = loadPlaybook(slug, 1);
  const priceLabel = formatPlaybookPrice();
  const title = playbook?.title ?? buildPlaybookTitle(config);

  const tocPreview =
    playbook?.chapters.map((ch) => ({
      number: ch.number,
      title: ch.title,
    })) ?? [
      { number: 1, title: "Why AI Now" },
      { number: 2, title: `The 7 Highest-ROI AI Use Cases for ${config.label}` },
      { number: 3, title: "Tool-by-Tool Implementation Guide" },
      { number: 4, title: "Your 90-Day AI Implementation Roadmap" },
      { number: 5, title: "Measuring Success: KPIs and ROI Tracking" },
      { number: 6, title: "Staff Training and Change Management" },
      { number: 7, title: "Resources, Tools, and Next Steps" },
    ];

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-ink px-6 py-12 text-paper">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-light">
            Clinovyr Industry Playbook
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-light leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            A complete implementation guide for {config.audience}. Seven chapters,
            tool directory, prompt library, ROI calculator, and printable checklists —
            everything you need to deploy AI in your {config.label.toLowerCase()} business.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          <section aria-labelledby="overview-heading">
            <h2
              id="overview-heading"
              className="font-display text-2xl text-ink"
            >
              What&apos;s inside
            </h2>
            <ul className="mt-6 space-y-3 text-muted">
              <li>7 implementation chapters tailored to {config.label}</li>
              <li>Tool directory with pricing and difficulty ratings</li>
              <li>8+ copy-ready AI prompts for daily workflows</li>
              <li>ROI calculator worksheet with worked example</li>
              <li>3 printable checklists for rollout and governance</li>
            </ul>
          </section>

          <section aria-labelledby="toc-heading">
            <h2 id="toc-heading" className="font-display text-2xl text-ink">
              Table of contents
            </h2>
            <ol className="mt-6 divide-y divide-rule border border-rule rounded-sm">
              {tocPreview.map((item) => (
                <li
                  key={item.number}
                  className="flex gap-4 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-accent">{item.number}.</span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="preview-heading">
            <h2 id="preview-heading" className="font-display text-2xl text-ink">
              Sample pages
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  className="overflow-hidden rounded-sm border border-rule bg-ink shadow-lg"
                >
                  <Image
                    src={`/previews/${slug}/page-${page}.svg`}
                    alt={`Sample page ${page} from the ${config.label} playbook`}
                    width={400}
                    height={520}
                    className="h-auto w-full"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-sm border border-rule bg-cream p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              One-time purchase
            </p>
            <p className="mt-2 font-display text-4xl text-ink">{priceLabel}</p>
            <p className="mt-2 text-sm text-muted">
              Instant PDF download + email delivery
            </p>
            <div className="mt-6">
              <PurchaseButton
                industrySlug={slug}
                industryLabel={config.label}
                priceLabel={priceLabel}
              />
            </div>
            <p className="mt-4 text-xs text-muted">
              Secure checkout via Stripe. Questions?{" "}
              <a href="mailto:hello@clinovyr.com" className="text-accent">
                hello@clinovyr.com
              </a>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
