import Link from "next/link";
import { INDUSTRIES } from "@/lib/industries";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-ink px-6 py-8 text-paper">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-light">
          Clinovyr Playbooks
        </p>
        <h1 className="mt-2 font-display text-4xl font-light">
          Industry AI Implementation Playbooks
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Practical 25–30 page guides for Placer County businesses — workflows,
          prompts, tools, and 90-day roadmaps.
        </p>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-12 md:grid-cols-2">
        {INDUSTRIES.map((industry) => (
          <Link
            key={industry.slug}
            href={`/playbooks/${industry.slug}`}
            className="group rounded-sm border border-rule bg-cream p-8 transition hover:border-accent"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              Playbook
            </p>
            <h2 className="mt-2 font-display text-2xl group-hover:text-accent">
              {industry.label}
            </h2>
            <p className="mt-3 text-sm text-muted">
              For {industry.audience}.
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
