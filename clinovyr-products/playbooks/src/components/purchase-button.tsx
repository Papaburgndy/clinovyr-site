"use client";

import { useState } from "react";

type PurchaseButtonProps = {
  industrySlug: string;
  industryLabel: string;
  priceLabel: string;
};

export function PurchaseButton({
  industrySlug,
  industryLabel,
  priceLabel,
}: PurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/playbook-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: industrySlug }),
      });

      const data = (await response.json()) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="w-full rounded-sm bg-accent px-8 py-4 font-mono text-sm uppercase tracking-wider text-paper transition hover:bg-accent-light disabled:opacity-60"
        aria-label={`Purchase ${industryLabel} playbook for ${priceLabel}`}
      >
        {loading ? "Redirecting to checkout…" : `Purchase — ${priceLabel}`}
      </button>
      {error ? (
        <p className="font-mono text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
