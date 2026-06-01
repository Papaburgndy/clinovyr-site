import { AIReadinessForm } from "@/components/ai-readiness-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-rule bg-ink px-6 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent-light">
            Clinovyr
          </p>
          <h1 className="mt-1 font-serif text-2xl text-paper sm:text-3xl">
            AI Readiness Assessment
          </h1>
          <p className="mt-2 text-sm text-paper/70">
            Intelligence, Applied. — Granite Bay, California
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 sm:px-8 sm:py-14">
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Tell us about your business and we&apos;ll prepare a tailored consultation
          focused on where AI can save time, reduce costs, and help you grow.
        </p>
        <AIReadinessForm />
      </main>

      <footer className="border-t border-rule px-6 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Clinovyr · clinovyr.com
      </footer>
    </div>
  );
}
