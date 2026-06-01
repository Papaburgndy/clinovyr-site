"use client";

import { SessionProvider } from "next-auth/react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface DashboardShellProps {
  children: React.ReactNode;
  clientName: string;
  userEmail: string;
  isAdmin?: boolean;
}

export function DashboardShell({
  children,
  clientName,
  userEmail,
  isAdmin,
}: DashboardShellProps) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-cream">
        <DashboardSidebar isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader clientName={clientName} userEmail={userEmail} />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
