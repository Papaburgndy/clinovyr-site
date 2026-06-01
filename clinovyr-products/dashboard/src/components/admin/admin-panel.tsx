"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClientSummary } from "@/lib/types";

interface AdminPanelProps {
  clients: ClientSummary[];
  revenue: { totalMrr: number; byTier: Record<string, number> };
}

export function AdminPanel({ clients: initialClients, revenue }: AdminPanelProps) {
  const [clients] = useState(initialClients);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function runAction(clientId: string, action: string) {
    setActionMessage(null);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, action }),
    });
    const data = await res.json();
    setActionMessage(data.message ?? data.error);
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Admin</h1>
        <p className="mt-1 text-muted">Manage all client accounts</p>
      </div>

      {actionMessage && (
        <p className="rounded-md bg-cream px-4 py-2 text-sm">{actionMessage}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="font-mono text-xs uppercase text-muted">Total MRR</p>
          <p className="mt-2 font-display text-3xl font-semibold text-accent">
            ${revenue.totalMrr.toLocaleString()}
          </p>
        </Card>
        {Object.entries(revenue.byTier).map(([tier, mrr]) => (
          <Card key={tier}>
            <p className="font-mono text-xs uppercase text-muted">{tier} MRR</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              ${mrr.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-rule">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream font-mono text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">MRR</th>
              <th className="px-4 py-3">Automations</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule bg-paper">
            {clients.map((client) => (
              <tr key={client.clientId}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{client.clientName}</p>
                  <p className="text-xs text-muted">{client.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{client.plan}</td>
                <td className="px-4 py-3 font-mono">
                  ${client.mrr.toLocaleString()}
                </td>
                <td className="px-4 py-3">{client.automationsCount}</td>
                <td className="px-4 py-3">{formatDate(client.lastActive)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => runAction(client.clientId, "generate_report")}
                    >
                      Report
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => runAction(client.clientId, "add_automation")}
                    >
                      + Auto
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => runAction(client.clientId, "send_checkin")}
                    >
                      Check-in
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
