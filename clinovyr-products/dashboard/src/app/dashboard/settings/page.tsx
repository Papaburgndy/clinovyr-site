import { SettingsForm } from "@/components/dashboard/settings-form";
import { auth } from "@/lib/auth";
import { getClientConfig, resolveClientId } from "@/lib/clients";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const clientId = await resolveClientId(session.user.email);
  if (!clientId) redirect("/login");

  const config = await getClientConfig(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-ink">Settings</h2>
        <p className="mt-1 text-muted">
          Manage notifications, escalation contacts, and chatbot configuration.
        </p>
      </div>
      <SettingsForm config={config} clientId={clientId} />
    </div>
  );
}
