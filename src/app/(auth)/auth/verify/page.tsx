"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";

type VerifyState = "loading" | "success" | "error";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const verify = useCallback(async () => {
    if (!token || !email) {
      setState("error");
      setMessage("This verification link is invalid or incomplete.");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });

      const data = (await res.json()) as { error?: string; success?: boolean };

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Verification failed.");
        return;
      }

      setState("success");
      setMessage("Your email is verified. Redirecting to onboarding…");

      window.setTimeout(() => {
        router.push("/onboarding");
      }, 2000);
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }, [token, email, router]);

  useEffect(() => {
    void verify();
  }, [verify]);

  async function handleResend() {
    if (!email) return;

    setResending(true);
    setResendMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setResendMessage(data.error ?? "Could not resend verification email.");
        return;
      }

      setResendMessage("A new verification link has been sent to your email.");
    } catch {
      setResendMessage("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        state === "loading"
          ? "Confirming your Clinovyr account…"
          : undefined
      }
    >
      {state === "loading" ? (
        <div className="flex flex-col items-center gap-4 py-6" role="status">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-paper/20 border-t-accent-light"
            aria-hidden="true"
          />
          <p className="font-sans text-sm text-paper/60">Verifying your email…</p>
        </div>
      ) : null}

      {state === "success" ? (
        <AuthMessage variant="success">{message}</AuthMessage>
      ) : null}

      {state === "error" ? (
        <div className="space-y-5">
          <AuthMessage variant="error">{message}</AuthMessage>
          {email ? (
            <>
              <Button
                type="button"
                className="w-full"
                disabled={resending}
                onClick={() => void handleResend()}
              >
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
              {resendMessage ? (
                <AuthMessage variant="info">{resendMessage}</AuthMessage>
              ) : null}
            </>
          ) : null}
          <p className="text-center font-sans text-sm text-paper/60">
            <Link
              href="/auth/login"
              className="text-accent-light underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      ) : null}
    </AuthCard>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Verify your email" subtitle="Loading…">
          <div className="flex justify-center py-8">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-paper/20 border-t-accent-light"
              aria-hidden="true"
            />
          </div>
        </AuthCard>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
