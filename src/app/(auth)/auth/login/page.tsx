"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput, AuthLabel, AuthMessage } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/auth-validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    isValidEmail(email) && password.length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Invalid email or password, or your email is not verified yet.",
        );
        return;
      }

      const redirectRes = await fetch("/api/auth/redirect-url");
      if (redirectRes.ok) {
        const data = (await redirectRes.json()) as { url: string };
        router.push(data.url);
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your Clinovyr dashboard and onboarding."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

        <div>
          <AuthLabel htmlFor="email">Email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link
              href="/auth/forgot-password"
              className="font-sans text-xs text-accent-light underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <AuthInput
            id="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            disabled={submitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center font-sans text-sm text-paper/60">
          New to Clinovyr?{" "}
          <Link
            href="/auth/register"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
