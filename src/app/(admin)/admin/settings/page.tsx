import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "(not set)";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Settings
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          Admin configuration (stub)
        </p>
      </header>
      <div className="max-w-lg rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <Settings className="mb-4 h-6 w-6 text-muted" />
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Admin email (env)
            </dt>
            <dd className="mt-1 font-mono text-paper">{adminEmail}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Access
            </dt>
            <dd className="mt-1 text-paper/70">
              Only the account matching ADMIN_EMAIL can access /admin routes
              (middleware + server layout).
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
