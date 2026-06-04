"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckoutButtonProps = {
  apiPath?: string;
  className?: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
};

export function CheckoutButton({
  apiPath = "/api/checkout/create",
  className,
  children,
  variant,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiPath, { method: "POST" });
      const data = (await response.json()) as {
        url?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? data.message ?? "Checkout is temporarily unavailable.",
        );
      }

      if (!data.url) {
        throw new Error("No checkout URL returned.");
      }

      router.push(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant={variant}
        onClick={handleCheckout}
        disabled={loading}
        className={cn(className)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Preparing checkout…
          </>
        ) : (
          children
        )}
      </Button>
      {error ? (
        <p className="mt-3 font-sans text-sm text-amber-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
