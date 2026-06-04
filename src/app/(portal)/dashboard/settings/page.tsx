import type { Metadata } from "next";
import { CompanySettingsForm } from "@/components/portal/company-settings-form";
import { getPortalCompany } from "@/lib/portal-data";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your Clinovyr portal account.",
};

export default async function SettingsPage() {
  const { session, company } = await getPortalCompany();

  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent-light">
          Settings
        </p>
        <h1 className="mt-2 font-display text-3xl font-light text-paper">
          Account Settings
        </h1>
        <p className="mt-3 font-sans text-sm text-paper/60">
          Update your company profile used for assessments and deliverables.
        </p>

        <dl className="mt-8 space-y-4 rounded-sm border border-rule/15 bg-ink/60 p-6 backdrop-blur-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Account name
            </dt>
            <dd className="mt-1 font-sans text-paper">
              {session.user.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-paper/45">
              Email
            </dt>
            <dd className="mt-1 font-sans text-paper">{session.user.email}</dd>
          </div>
        </dl>

        {company ? (
          <CompanySettingsForm
            initial={{
              name: company.name,
              industry: company.industry,
              size: company.size,
              revenue: company.revenue,
              city: company.city,
              state: company.state,
              phone: company.phone ?? "",
              website: company.website ?? "",
            }}
          />
        ) : (
          <p className="mt-6 font-sans text-sm text-paper/60">
            Complete onboarding first to add your company profile.
          </p>
        )}
      </div>
    </div>
  );
}
