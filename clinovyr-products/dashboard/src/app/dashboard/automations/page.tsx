import { AutomationsTable } from "@/components/dashboard/automations-table";
import { auth } from "@/lib/auth";
import { getAutomations, resolveClientId } from "@/lib/clients";
import { redirect } from "next/navigation";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const clientId = await resolveClientId(session.user.email);
  if (!clientId) redirect("/login");

  const automations = await getAutomations(clientId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold text-ink">
          Automations
        </h2>
        <p className="mt-1 text-muted">
          Monitor status, run history, and error logs for all automations.
        </p>
      </div>
      <AutomationsTable automations={automations} />
    </div>
  );
}
