import { AdminPanel } from "@/components/admin/admin-panel";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { getAllClientSummaries, getRevenueSummary } from "@/lib/clients";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (!session.user.isAdmin) redirect("/dashboard");

  const [clients, revenue] = await Promise.all([
    getAllClientSummaries(),
    getRevenueSummary(),
  ]);

  return (
    <DashboardShell
      clientName="Clinovyr Admin"
      userEmail={session.user.email}
      isAdmin
    >
      <AdminPanel clients={clients} revenue={revenue} />
    </DashboardShell>
  );
}
