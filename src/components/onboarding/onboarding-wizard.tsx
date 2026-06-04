"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import {
  AuthInput,
  AuthLabel,
  AuthMessage,
} from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  ONBOARDING_GOALS,
  REVENUE_RANGES,
  URGENCY_OPTIONS,
  type OnboardingGoalId,
  type UrgencyId,
} from "@/lib/onboarding/constants";
import { recommendProduct } from "@/lib/onboarding/recommendations";
import type { CompanyOnboardingNotes } from "@/lib/onboarding/types";
import { validateWebsite } from "@/lib/onboarding/validation";
import { cn } from "@/lib/utils";

type CompanyProfile = {
  name: string;
  industry: string;
  size: string;
  revenue: string;
  city: string;
  state: string;
  phone: string;
  website: string;
};

type StatusResponse = {
  hasCompany: boolean;
  hasGoals: boolean;
  onboardingComplete: boolean;
  company: CompanyProfile | null;
  notes: CompanyOnboardingNotes | null;
};

const STEPS = [
  { id: 1, label: "Company" },
  { id: 2, label: "Goals" },
  { id: 3, label: "Confirm" },
] as const;

const emptyProfile: CompanyProfile = {
  name: "",
  industry: "",
  size: "",
  revenue: "",
  city: "",
  state: "CA",
  phone: "",
  website: "",
};

export function OnboardingWizard() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<CompanyProfile>(emptyProfile);
  const [goals, setGoals] = useState<OnboardingGoalId[]>([]);
  const [urgency, setUrgency] = useState<UrgencyId | "">("");
  const [websiteError, setWebsiteError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/status");
      if (!res.ok) {
        setError("Could not load your onboarding progress.");
        return;
      }
      const data = (await res.json()) as StatusResponse;

      if (data.onboardingComplete) {
        router.replace("/dashboard");
        return;
      }

      if (data.company) {
        setProfile({
          name: data.company.name,
          industry: data.company.industry,
          size: data.company.size,
          revenue: data.company.revenue,
          city: data.company.city,
          state: data.company.state,
          phone: data.company.phone ?? "",
          website: data.company.website ?? "",
        });
      }

      if (data.notes?.goals?.length) {
        setGoals(data.notes.goals);
        setUrgency(data.notes.urgency);
      }

      if (data.hasGoals) {
        setStep(3);
      } else if (data.hasCompany) {
        setStep(2);
      }
    } catch {
      setError("Something went wrong. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  function toggleGoal(goalId: OnboardingGoalId) {
    setGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId],
    );
  }

  async function refreshSessionFlags(flags: {
    onboardingComplete?: boolean;
    hasCompanyProfile?: boolean;
  }) {
    await updateSession(flags);
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setWebsiteError("");

    if (profile.website && !validateWebsite(profile.website)) {
      setWebsiteError("Please enter a valid website URL.");
      return;
    }

    if (
      !profile.name.trim() ||
      !profile.industry ||
      !profile.size ||
      !profile.revenue ||
      !profile.city.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save company profile.");
        return;
      }

      await refreshSessionFlags({ hasCompanyProfile: true });
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (goals.length === 0 || !urgency) {
      setError("Select at least one goal and your timeline.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/save-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, urgency }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save your selections.");
        return;
      }

      setStep(3);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not complete onboarding.");
        return;
      }

      await refreshSessionFlags({
        onboardingComplete: true,
        hasCompanyProfile: true,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const recommendation =
    goals.length > 0 && urgency
      ? recommendProduct(goals, urgency as UrgencyId)
      : null;

  if (loading) {
    return (
      <AuthCard title="Welcome to Clinovyr" subtitle="Loading your profile…">
        <div className="flex justify-center py-10" role="status">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-paper/20 border-t-accent-light"
            aria-hidden="true"
          />
        </div>
      </AuthCard>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <nav
        className="mb-8 flex items-center justify-center gap-2"
        aria-label="Onboarding progress"
      >
        {STEPS.map((s, index) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs",
                step >= s.id
                  ? "bg-accent text-paper"
                  : "border border-rule/30 text-paper/40",
              )}
              aria-current={step === s.id ? "step" : undefined}
            >
              {s.id}
            </div>
            <span
              className={cn(
                "hidden font-mono text-[11px] uppercase tracking-wider sm:inline",
                step >= s.id ? "text-paper/80" : "text-paper/35",
              )}
            >
              {s.label}
            </span>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mx-1 h-px w-8 sm:w-12",
                  step > s.id ? "bg-accent/60" : "bg-rule/25",
                )}
                aria-hidden="true"
              />
            ) : null}
          </div>
        ))}
      </nav>

      {step === 1 ? (
        <AuthCard
          title="Company profile"
          subtitle="Tell us about your business so we can tailor your Clinovyr experience."
          className="max-w-2xl"
        >
          <form onSubmit={(e) => void handleStep1(e)} className="space-y-4">
            {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

            <div>
              <AuthLabel htmlFor="name">Company / Practice Name</AuthLabel>
              <AuthInput
                id="name"
                value={profile.name}
                onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <AuthLabel htmlFor="industry">Industry</AuthLabel>
                <select
                  id="industry"
                  value={profile.industry}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, industry: e.target.value }))
                  }
                  required
                  disabled={submitting}
                  className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <AuthLabel htmlFor="size">Company Size</AuthLabel>
                <select
                  id="size"
                  value={profile.size}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, size: e.target.value }))
                  }
                  required
                  disabled={submitting}
                  className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <AuthLabel htmlFor="revenue">Annual Revenue</AuthLabel>
              <select
                id="revenue"
                value={profile.revenue}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, revenue: e.target.value }))
                }
                required
                disabled={submitting}
                className="w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40"
              >
                <option value="">Select range</option>
                {REVENUE_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <AuthLabel htmlFor="city">City</AuthLabel>
                <AuthInput
                  id="city"
                  value={profile.city}
                  onChange={(v) => setProfile((p) => ({ ...p, city: v }))}
                  placeholder="Granite Bay"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <AuthLabel htmlFor="state">State</AuthLabel>
                <AuthInput
                  id="state"
                  value={profile.state}
                  onChange={(v) =>
                    setProfile((p) => ({
                      ...p,
                      state: v.toUpperCase().slice(0, 2),
                    }))
                  }
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <AuthLabel htmlFor="phone">Business Phone (optional)</AuthLabel>
                <AuthInput
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
                  disabled={submitting}
                />
              </div>
              <div>
                <AuthLabel htmlFor="website">Website (optional)</AuthLabel>
                <AuthInput
                  id="website"
                  type="url"
                  value={profile.website}
                  onChange={(v) => setProfile((p) => ({ ...p, website: v }))}
                  error={websiteError}
                  disabled={submitting}
                  placeholder="https://"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Continue"}
            </Button>
          </form>
        </AuthCard>
      ) : null}

      {step === 2 ? (
        <AuthCard
          title="How can we help?"
          subtitle="What brings you to Clinovyr today?"
          className="max-w-2xl"
        >
          <form onSubmit={(e) => void handleStep2(e)} className="space-y-6">
            {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

            <fieldset>
              <legend className="sr-only">Goals</legend>
              <ul className="space-y-3">
                {ONBOARDING_GOALS.map((goal) => (
                  <li key={goal.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 transition-colors",
                        goals.includes(goal.id)
                          ? "border-accent/50 bg-accent/10"
                          : "border-rule/20 bg-ink/40 hover:border-rule/35",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-accent"
                        checked={goals.includes(goal.id)}
                        onChange={() => toggleGoal(goal.id)}
                        disabled={submitting}
                      />
                      <span className="font-sans text-sm leading-relaxed text-paper/90">
                        {goal.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset>
              <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/50">
                Timeline
              </legend>
              <ul className="space-y-2">
                {URGENCY_OPTIONS.map((option) => (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 transition-colors",
                        urgency === option.id
                          ? "border-accent/50 bg-accent/10"
                          : "border-rule/20 bg-ink/40 hover:border-rule/35",
                      )}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        className="accent-accent"
                        checked={urgency === option.id}
                        onChange={() => setUrgency(option.id)}
                        disabled={submitting}
                      />
                      <span className="font-sans text-sm text-paper/90">
                        {option.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-paper/20 text-paper hover:bg-paper/5"
                disabled={submitting}
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Continue"}
              </Button>
            </div>
          </form>
        </AuthCard>
      ) : null}

      {step === 3 ? (
        <AuthCard
          title="You're all set"
          subtitle="Review your profile and see your recommended starting point."
          className="max-w-2xl"
        >
          <div className="space-y-6">
            {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

            <section className="rounded-sm border border-rule/20 bg-ink/50 p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper/50">
                Your profile
              </h2>
              <dl className="mt-3 space-y-2 font-sans text-sm text-paper/85">
                <div className="flex justify-between gap-4">
                  <dt className="text-paper/50">Company</dt>
                  <dd className="text-right">{profile.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-paper/50">Industry</dt>
                  <dd className="text-right">{profile.industry}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-paper/50">Size</dt>
                  <dd className="text-right">{profile.size}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-paper/50">Location</dt>
                  <dd className="text-right">
                    {profile.city}, {profile.state}
                  </dd>
                </div>
              </dl>
            </section>

            {recommendation ? (
              <section className="rounded-sm border border-accent/30 bg-accent/10 p-4">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
                  Recommended for you
                </h2>
                <p className="mt-2 font-display text-2xl font-light text-paper">
                  {recommendation.product}
                </p>
                <p className="mt-1 font-sans text-sm text-paper/70">
                  {recommendation.tagline}
                </p>
                <p className="mt-3 font-sans text-sm leading-relaxed text-paper/60">
                  {recommendation.reason}
                </p>
              </section>
            ) : null}

            <section
              className="rounded-sm border border-rule/20 bg-gradient-to-br from-ink to-accent/20 p-5"
              aria-label="Dashboard preview"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-paper/45">
                Dashboard preview
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Automations", "Reports", "Roadmap"].map((label) => (
                  <div
                    key={label}
                    className="rounded-sm border border-paper/10 bg-paper/5 px-3 py-4"
                  >
                    <div className="mb-2 h-2 w-8 rounded-full bg-accent-light/60" />
                    <div className="mb-1 h-2 w-full max-w-[80%] rounded-full bg-paper/15" />
                    <div className="h-2 w-2/3 rounded-full bg-paper/10" />
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-paper/40">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 font-sans text-xs text-paper/45">
                Your full dashboard unlocks after onboarding — track AI wins,
                reports, and next steps in one place.
              </p>
            </section>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-paper/20 text-paper hover:bg-paper/5"
                disabled={submitting}
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleComplete()}
              >
                {submitting ? "Finishing…" : "Enter My Dashboard →"}
              </Button>
            </div>
          </div>
        </AuthCard>
      ) : null}
    </div>
  );
}
