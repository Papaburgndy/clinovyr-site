import type { Metadata } from "next";
import { Bot, ExternalLink, FileCode } from "lucide-react";
import Link from "next/link";
import { LockedPage } from "@/components/portal/locked-page";
import { Button } from "@/components/ui/button";
import { getPortalCompany } from "@/lib/portal-data";
import { getContactEmail } from "@/lib/assessment-email";

const AGENT_PRODUCTION_URL = "https://agent.clinovyr.com";

export const metadata: Metadata = {
  title: "AI Agent",
  description: "Clinovyr AI agent for your business.",
};

export default async function AgentPage() {
  const { company, isPaid } = await getPortalCompany();

  if (!isPaid) {
    return <LockedPage title="AI Agent" />;
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          AI Agent
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          Website AI Agent
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-paper/60">
          Your Clinovyr AI agent answers visitor questions on your website, captures
          leads, and escalates to your team when needed. Portal chat is coming soon —
          use the hosted agent or embed while we finish kickoff.
        </p>

        <div className="mt-8 space-y-4 rounded-sm border border-rule/15 bg-ink/60 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 h-5 w-5 shrink-0 text-accent-light" aria-hidden />
            <div>
              <h2 className="font-sans text-sm font-medium text-paper">
                Hosted agent
              </h2>
              <p className="mt-1 font-sans text-sm text-paper/55">
                Production widget runs at agent.clinovyr.com with your client config
                after Clinovyr deploys your instance.
              </p>
              <a
                href={AGENT_PRODUCTION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm text-accent-light underline-offset-4 hover:underline"
              >
                Open agent host
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-rule/10 pt-4">
            <FileCode className="mt-0.5 h-5 w-5 shrink-0 text-accent-light" aria-hidden />
            <div>
              <h2 className="font-sans text-sm font-medium text-paper">
                Embed on your site
              </h2>
              <p className="mt-1 font-sans text-sm text-paper/55">
                After kickoff, Clinovyr provides a script snippet and{" "}
                <code className="font-mono text-xs text-paper/70">
                  config/clients/your-id.json
                </code>{" "}
                in the ai-agent product. Point the widget at your FAQs, hours, and
                escalation email.
              </p>
              <p className="mt-3 font-mono text-xs text-paper/45">
                Local setup: clinovyr-products/ai-agent/README.md (Operations Manual §6.2)
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 font-sans text-sm text-paper/50">
          {company
            ? `Configured for ${company.name}. Questions? Email ${getContactEmail()}.`
            : "Complete your company profile in settings before agent go-live."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/dashboard/settings" variant="outline">
            Company settings
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center font-sans text-sm text-paper/50 underline-offset-4 hover:text-paper/70 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
