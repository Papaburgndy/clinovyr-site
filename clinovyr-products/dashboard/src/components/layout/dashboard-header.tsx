"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  clientName: string;
  userEmail: string;
}

export function DashboardHeader({ clientName, userEmail }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-rule bg-paper px-8 py-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          {clientName}
        </h1>
        <p className="text-sm text-muted">{userEmail}</p>
      </div>
      <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </Button>
    </header>
  );
}
