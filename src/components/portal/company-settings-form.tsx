"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AuthInput,
  AuthLabel,
  AuthMessage,
} from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  REVENUE_RANGES,
} from "@/lib/onboarding/constants";
import { validateWebsite } from "@/lib/onboarding/validation";
import { cn } from "@/lib/utils";

export type CompanySettingsInitial = {
  name: string;
  industry: string;
  size: string;
  revenue: string;
  city: string;
  state: string;
  phone: string;
  website: string;
};

type CompanySettingsFormProps = {
  initial: CompanySettingsInitial;
};

export function CompanySettingsForm({ initial }: CompanySettingsFormProps) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [websiteError, setWebsiteError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (profile.website && !validateWebsite(profile.website)) {
      setWebsiteError("Please enter a valid website URL.");
      return;
    }
    setWebsiteError("");

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/save-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          industry: profile.industry,
          size: profile.size,
          revenue: profile.revenue,
          city: profile.city,
          state: profile.state,
          phone: profile.phone || undefined,
          website: profile.website || undefined,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save company profile.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <AuthLabel htmlFor="settings-name">Company name</AuthLabel>
        <AuthInput
          id="settings-name"
          value={profile.name}
          onChange={(name) => setProfile((p) => ({ ...p, name }))}
          required
        />
      </div>

      <div>
        <AuthLabel htmlFor="settings-industry">Industry</AuthLabel>
        <select
          id="settings-industry"
          value={profile.industry}
          onChange={(e) =>
            setProfile((p) => ({ ...p, industry: e.target.value }))
          }
          required
          className={cn(
            "w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper",
            "focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40",
          )}
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <AuthLabel htmlFor="settings-size">Team size</AuthLabel>
          <select
            id="settings-size"
            value={profile.size}
            onChange={(e) =>
              setProfile((p) => ({ ...p, size: e.target.value }))
            }
            required
            className={cn(
              "w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper",
              "focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40",
            )}
          >
            <option value="">Select size</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <AuthLabel htmlFor="settings-revenue">Annual revenue</AuthLabel>
          <select
            id="settings-revenue"
            value={profile.revenue}
            onChange={(e) =>
              setProfile((p) => ({ ...p, revenue: e.target.value }))
            }
            required
            className={cn(
              "w-full rounded-sm border border-rule/25 bg-ink px-4 py-3 font-sans text-sm text-paper",
              "focus:border-accent-light/50 focus:outline-none focus:ring-2 focus:ring-accent-light/40",
            )}
          >
            <option value="">Select range</option>
            {REVENUE_RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <AuthLabel htmlFor="settings-city">City</AuthLabel>
          <AuthInput
            id="settings-city"
            value={profile.city}
            onChange={(city) => setProfile((p) => ({ ...p, city }))}
            required
          />
        </div>
        <div>
          <AuthLabel htmlFor="settings-state">State</AuthLabel>
          <AuthInput
            id="settings-state"
            value={profile.state}
            onChange={(state) =>
              setProfile((p) => ({ ...p, state: state.toUpperCase().slice(0, 2) }))
            }
            required
          />
        </div>
      </div>

      <div>
        <AuthLabel htmlFor="settings-phone">Phone (optional)</AuthLabel>
        <AuthInput
          id="settings-phone"
          type="tel"
          value={profile.phone}
          onChange={(phone) => setProfile((p) => ({ ...p, phone }))}
        />
      </div>

      <div>
        <AuthLabel htmlFor="settings-website">Website (optional)</AuthLabel>
        <AuthInput
          id="settings-website"
          value={profile.website}
          onChange={(website) => setProfile((p) => ({ ...p, website }))}
          error={websiteError}
          placeholder="https://"
        />
      </div>

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
      {success ? (
        <AuthMessage variant="success">Company profile saved.</AuthMessage>
      ) : null}

      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? "Saving…" : "Save company profile"}
      </Button>
    </form>
  );
}
