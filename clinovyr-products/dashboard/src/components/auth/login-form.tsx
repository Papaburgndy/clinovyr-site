"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  callbackUrl?: string;
  providerId: string;
}

export function LoginForm({
  callbackUrl = "/dashboard",
  providerId,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(providerId, {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Unable to send magic link. Check your email or contact support.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-rule bg-paper p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Check your email
        </h2>
        <p className="mt-3 text-muted">
          We sent a magic link to <strong className="text-ink">{email}</strong>.
          Click the link to sign in.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-rule bg-paper p-8"
    >
      <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
      <p className="mt-2 text-sm text-muted">
        Enter your registered email to receive a magic link.
      </p>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="mt-6 block text-sm font-medium text-ink">
        Email address
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          className="mt-1 w-full rounded-md border border-rule px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </label>

      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? "Sending…" : "Send magic link"}
      </Button>

      <p className="mt-4 text-center text-xs text-muted">
        Demo: demo@demopractice.com
      </p>
    </form>
  );
}
