import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TasksChart } from "@/components/dashboard/tasks-chart";
import { Badge, statusToBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import {
  getActivity,
  getAutomations,
  getClientConfig,
  getKpis,
  resolveClientId,
} from "@/lib/clients";
import { redirect } from "next/navigation";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const clientId = await resolveClientId(session.user.email);
  if (!clientId) redirect("/login");

  const [config, kpis, automations, activity] = await Promise.all([
    getClientConfig(clientId),
    getKpis(clientId),
    getAutomations(clientId),
    getActivity(clientId),
  ]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-ink">
          {getGreeting()}, {config.clientName.split(" ")[0]}
        </h2>
        <p className="mt-1 text-muted">{today}</p>
      </div>

      <KpiCards kpis={kpis} />

      <Card>
        <CardHeader>
          <CardTitle>Tasks Automated — Last 6 Months</CardTitle>
        </CardHeader>
        <TasksChart data={kpis.tasksByMonth} />
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Automations</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between rounded-md border border-rule px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{automation.name}</p>
                  <p className="text-xs text-muted">
                    Last run: {formatDate(automation.lastRun)} ·{" "}
                    {automation.tasksThisMonth} tasks this month
                  </p>
                </div>
                <Badge variant={statusToBadge(automation.status)}>
                  {automation.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {activity.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="border-l-2 border-accent pl-4 py-1"
              >
                <p className="text-sm text-ink">{event.message}</p>
                <p className="text-xs text-muted">
                  {formatDate(event.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
