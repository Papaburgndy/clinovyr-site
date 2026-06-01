import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { getClientConfig, resolveClientId } from "@/lib/clients";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const clientId = await resolveClientId(session.user.email);
  if (!clientId) redirect("/login");

  const config = await getClientConfig(clientId);

  return (
    <DashboardShell
      clientName={config.clientName}
      userEmail={session.user.email}
      isAdmin={session.user.isAdmin}
    >
      {children}
    </DashboardShell>
  );
}
