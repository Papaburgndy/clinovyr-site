import { ReportsList } from "@/components/dashboard/reports-list";
import { auth } from "@/lib/auth";
import { getReports, resolveClientId } from "@/lib/clients";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const clientId = await resolveClientId(session.user.email);
  if (!clientId) redirect("/login");

  const reports = await getReports(clientId);

  return <ReportsList reports={reports} clientId={clientId} />;
}
