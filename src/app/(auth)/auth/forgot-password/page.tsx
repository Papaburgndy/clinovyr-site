"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput, AuthLabel, AuthMessage } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/auth-validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not send reset email.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If an account exists for that address, we sent password reset instructions."
      >
        <AuthMessage variant="success">
          If an account exists for{" "}
          <span className="font-medium text-paper">{email}</span>, you will
          receive a reset link shortly.
        </AuthMessage>
        <p className="mt-6 text-center font-sans text-sm text-paper/60">
          <Link
            href="/auth/login"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we will send you a link to reset your password."
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

        <Button
          type="submit"
          className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isValidEmail(email) || submitting}
        >
          {submitting ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center font-sans text-sm text-paper/60">
          <Link
            href="/auth/login"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
