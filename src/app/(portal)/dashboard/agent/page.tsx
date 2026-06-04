import type { Metadata } from "next";
import { LockedPage } from "@/components/portal/locked-page";
import { getPortalCompany } from "@/lib/portal-data";

export const metadata: Metadata = {
  title: "AI Agent",
  description: "Clinovyr AI agent for your business.",
};

export default async function AgentPage() {
  const { isPaid } = await getPortalCompany();

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
          AI Agent
        </h1>
        <p className="mt-3 font-sans text-sm text-paper/60">
          Your dedicated Clinovyr AI assistant will be available here after
          kickoff. Chat interface coming soon.
        </p>
      </div>
    </div>
  );
}
