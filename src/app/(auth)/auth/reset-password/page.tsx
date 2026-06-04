"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput, AuthLabel, AuthMessage } from "@/components/auth/auth-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import {
  getPasswordStrength,
  passwordsMatch,
} from "@/lib/auth-validation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const confirmError = useMemo(() => {
    if (!confirmPassword) return undefined;
    return passwordsMatch(password, confirmPassword)
      ? undefined
      : "Passwords do not match";
  }, [password, confirmPassword]);

  const canSubmit =
    token &&
    email &&
    password.length >= 8 &&
    passwordsMatch(password, confirmPassword) &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || !email) {
    return (
      <AuthCard title="Invalid link" subtitle="This password reset link is incomplete.">
        <AuthMessage variant="error">
          Request a new reset link from the forgot password page.
        </AuthMessage>
        <p className="mt-6 text-center font-sans text-sm text-paper/60">
          <Link
            href="/auth/forgot-password"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Forgot password
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard title="Password updated" subtitle="You can now sign in with your new password.">
        <AuthMessage variant="success">
          Your password has been reset. Redirecting to sign in…
        </AuthMessage>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password for your Clinovyr account."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

        <div>
          <AuthLabel htmlFor="password">New password</AuthLabel>
          <AuthInput
            id="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            disabled={submitting}
            error={
              password && password.length < 8
                ? "Password must be at least 8 characters"
                : undefined
            }
          />
          <PasswordStrengthMeter strength={passwordStrength} />
        </div>

        <div>
          <AuthLabel htmlFor="confirmPassword">Confirm password</AuthLabel>
          <AuthInput
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            disabled={submitting}
            error={confirmError}
          />
        </div>

        <Button
          type="submit"
          className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
        >
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Set a new password" subtitle="Loading…">
          <div className="flex justify-center py-8">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-paper/20 border-t-accent-light"
              aria-hidden="true"
            />
          </div>
        </AuthCard>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
