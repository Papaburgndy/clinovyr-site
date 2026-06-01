"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-paper px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        Something went wrong
      </p>

      <h1 className="mt-6 max-w-lg font-display text-4xl font-light leading-tight text-ink md:text-5xl">
        We hit an unexpected error
      </h1>

      <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-muted">
        Please try again, or return to the homepage to continue exploring
        Clinovyr.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="button" onClick={reset} className="min-h-11">
          Try again
        </Button>
        <Link
          href="/"
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-sm border border-ink/20 px-6 py-3",
            "font-sans text-sm font-medium text-ink transition-all duration-300",
            "hover:border-ink/40 hover:bg-ink/5",
          )}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
