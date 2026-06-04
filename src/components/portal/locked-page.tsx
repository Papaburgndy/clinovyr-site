import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockedPage({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <div className="rounded-sm border border-rule/15 bg-ink/60 p-8 text-center backdrop-blur-sm">
          <Lock
            className="mx-auto h-10 w-10 text-paper/40"
            aria-hidden
          />
          <h1 className="mt-4 font-display text-2xl font-light text-paper">
            {title}
          </h1>
          <p className="mt-3 font-sans text-sm text-paper/60">
            Unlock by purchasing your AI Readiness Assessment package from the
            dashboard.
          </p>
          <Button href="/dashboard" className="mt-6">
            Back to dashboard
          </Button>
          <p className="mt-4">
            <Link
              href="/dashboard/assessment"
              className="font-sans text-sm text-accent-light underline-offset-4 hover:underline"
            >
              View assessment
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
