"use client";

import { Fragment, useState } from "react";
import { Badge, statusToBadge } from "@/components/ui/badge";
import type { Automation } from "@/lib/types";
import { cn } from "@/lib/cn";

interface AutomationsTableProps {
  automations: Automation[];
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

export function AutomationsTable({ automations }: AutomationsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-rule">
      <table className="w-full text-left text-sm">
        <thead className="bg-cream font-mono text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Description</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Runs</th>
            <th className="px-4 py-3">Success</th>
            <th className="hidden px-4 py-3 lg:table-cell">Last Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule bg-paper">
          {automations.map((automation) => (
            <Fragment key={automation.id}>
              <tr
                className="cursor-pointer hover:bg-cream/50"
                onClick={() =>
                  setExpanded(expanded === automation.id ? null : automation.id)
                }
              >
                <td className="px-4 py-3 font-medium text-ink">
                  <span className="mr-2 text-muted">
                    {expanded === automation.id ? "▼" : "▶"}
                  </span>
                  {automation.name}
                </td>
                <td className="hidden px-4 py-3 text-muted md:table-cell">
                  {automation.description}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusToBadge(automation.status)}>
                    {automation.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono">{automation.runCount}</td>
                <td className="px-4 py-3 font-mono">
                  {automation.successRate}%
                </td>
                <td className="hidden max-w-xs truncate px-4 py-3 text-red-700 lg:table-cell">
                  {automation.lastError ?? "—"}
                </td>
              </tr>
              {expanded === automation.id && (
                <tr>
                  <td colSpan={6} className="bg-cream/30 px-4 py-4">
                    <p className="mb-2 font-mono text-xs uppercase text-muted">
                      Last 5 runs
                    </p>
                    <div className="space-y-2">
                      {automation.recentRuns.map((run) => (
                        <div
                          key={run.id}
                          className="flex flex-wrap items-center gap-3 rounded border border-rule bg-paper px-3 py-2 text-xs"
                        >
                          <span
                            className={cn(
                              "font-mono uppercase",
                              run.status === "success"
                                ? "text-emerald-700"
                                : "text-red-700"
                            )}
                          >
                            {run.status}
                          </span>
                          <span className="text-muted">
                            {formatDate(run.timestamp)}
                          </span>
                          <span>{run.tasksProcessed} tasks</span>
                          <span className="text-muted">
                            {(run.durationMs / 1000).toFixed(1)}s
                          </span>
                          {run.message && (
                            <span className="text-red-600">{run.message}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
