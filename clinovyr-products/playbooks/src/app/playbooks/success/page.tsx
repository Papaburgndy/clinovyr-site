import Link from "next/link";
import { getIndustryBySlug } from "@/lib/industries";

type PageProps = {
  searchParams: Promise<{ session_id?: string; industry?: string }>;
};

export default async function PlaybookSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const industrySlug = params.industry ?? "medical";
  const sessionId = params.session_id;
  const config = getIndustryBySlug(industrySlug);

  const downloadUrl = sessionId
    ? `/api/playbook-download?session_id=${encodeURIComponent(sessionId)}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="max-w-md rounded-sm border border-rule bg-cream p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          Thank you
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink">
          Your playbook is ready
        </h1>
        <p className="mt-4 text-muted">
          {config
            ? `Your ${config.label} AI Implementation Playbook has been sent to your email.`
            : "Check your email for the download link."}
        </p>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="mt-8 inline-block rounded-sm bg-accent px-6 py-3 font-mono text-sm uppercase tracking-wider text-paper hover:bg-accent-light"
          >
            Download PDF now
          </a>
        ) : null}
        <p className="mt-6">
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Back to all playbooks
          </Link>
        </p>
      </div>
    </main>
  );
}
