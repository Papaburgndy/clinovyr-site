import { Settings } from "lucide-react";
import { isStripeConfigured } from "@/lib/stripe";

function envStatus(name: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? "Set" : "Missing";
}

export default function AdminSettingsPage() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "(not set)";
  const siteUrl = process.env.SITE_URL ?? process.env.NEXTAUTH_URL ?? "(not set)";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Settings
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          Portal &amp; admin configuration
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <Settings className="mb-4 h-6 w-6 text-muted" aria-hidden />
          <h2 className="font-sans text-sm font-medium text-paper">Access</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Admin email (ADMIN_EMAIL)
              </dt>
              <dd className="mt-1 font-mono text-paper">{adminEmail}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Protection
              </dt>
              <dd className="mt-1 text-paper/70">
                Middleware and admin layout require a signed-in user whose email
                matches ADMIN_EMAIL. All other users are redirected to login.
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-sans text-sm font-medium text-paper">
            Production URLs
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                SITE_URL / NEXTAUTH_URL
              </dt>
              <dd className="mt-1 font-mono text-xs text-paper break-all">
                {siteUrl}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Health check
              </dt>
              <dd className="mt-1 font-mono text-xs text-accent-light">
                GET /api/health — status ok, app clinovyr-portal
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6 lg:col-span-2">
          <h2 className="font-sans text-sm font-medium text-paper">
            Integration status (env presence only)
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs text-paper/80">
            <li>DATABASE_URL: {envStatus("DATABASE_URL")}</li>
            <li>STRIPE_SECRET_KEY: {isStripeConfigured() ? "Set" : "Missing"}</li>
            <li>STRIPE_WEBHOOK_SECRET: {envStatus("STRIPE_WEBHOOK_SECRET")}</li>
            <li>RESEND_API_KEY: {envStatus("RESEND_API_KEY")}</li>
            <li>BLOB_READ_WRITE_TOKEN: {envStatus("BLOB_READ_WRITE_TOKEN")}</li>
            <li>AUTH_SECRET: {envStatus("AUTH_SECRET")}</li>
          </ul>
          <p className="mt-4 text-sm text-paper/50">
            Set secrets in the Cloudflare Worker dashboard. Run{" "}
            <code className="font-mono text-xs">scripts/post-deploy-smoke.sh</code>{" "}
            after deploy. See DEPLOYMENT-CHECKLIST.md.
          </p>
        </div>
      </div>
    </div>
  );
}
