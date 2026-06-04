"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput, AuthLabel, AuthMessage } from "@/components/auth/auth-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import {
  getPasswordStrength,
  isValidEmail,
  passwordsMatch,
} from "@/lib/auth-validation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const emailError = useMemo(() => {
    if (!email) return undefined;
    return isValidEmail(email) ? undefined : "Enter a valid email address";
  }, [email]);

  const passwordStrength = getPasswordStrength(password);
  const passwordError = useMemo(() => {
    if (!password) return undefined;
    if (password.length < 8) return "Password must be at least 8 characters";
    return undefined;
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return undefined;
    return passwordsMatch(password, confirmPassword)
      ? undefined
      : "Passwords do not match";
  }, [password, confirmPassword]);

  const canSubmit =
    fullName.trim().length >= 2 &&
    isValidEmail(email) &&
    password.length >= 8 &&
    passwordsMatch(password, confirmPassword) &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email,
          password,
          confirmPassword,
        }),
      });

      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setServerError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a verification link to complete your registration."
      >
        <AuthMessage variant="success">
          Check your email — we sent a verification link to{" "}
          <span className="font-medium text-paper">{email}</span>.
        </AuthMessage>
        <p className="mt-6 text-center font-sans text-sm text-paper/60">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your Clinovyr onboarding — intelligence, applied for your business."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError ? (
          <AuthMessage variant="error">{serverError}</AuthMessage>
        ) : null}

        <div>
          <AuthLabel htmlFor="fullName">Full name</AuthLabel>
          <AuthInput
            id="fullName"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            required
            disabled={submitting}
          />
        </div>

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
            error={emailError}
          />
        </div>

        <div>
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <AuthInput
            id="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            disabled={submitting}
            error={passwordError}
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
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center font-sans text-xs leading-relaxed text-paper/45">
          By creating an account, you agree to our{" "}
          <Link
            href="/"
            className="text-paper/60 underline-offset-2 hover:text-accent-light hover:underline"
          >
            Terms of Service
          </Link>
          .
        </p>

        <p className="text-center font-sans text-sm text-paper/60">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-accent-light underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
