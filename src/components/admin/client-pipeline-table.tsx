import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { AdminActionButton } from "@/components/admin/admin-actions";
import {
  getPipelineStage,
  PIPELINE_ROW_CLASS,
  type CompanyWithRelations,
} from "@/lib/admin-data";
import {
  formatCents,
  formatOrderStatus,
  formatSurveyStatus,
} from "@/lib/admin-format";
import { getImpersonateDashboardUrl } from "@/lib/admin-impersonate";
import { cn } from "@/lib/utils";

export function ClientPipelineTable({
  companies,
  showCompanyLink = true,
}: {
  companies: CompanyWithRelations[];
  showCompanyLink?: boolean;
}) {
  if (companies.length === 0) {
    return (
      <p className="py-8 text-center font-mono text-xs text-muted">
        No companies registered yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-muted">
            <th className="px-3 py-2.5 font-normal">Company</th>
            <th className="px-3 py-2.5 font-normal">Industry</th>
            <th className="px-3 py-2.5 font-normal">Size</th>
            <th className="px-3 py-2.5 font-normal">Survey</th>
            <th className="px-3 py-2.5 font-normal">Order</th>
            <th className="px-3 py-2.5 font-normal">Package</th>
            <th className="px-3 py-2.5 font-normal">Amount</th>
            <th className="px-3 py-2.5 font-normal">Registered</th>
            <th className="px-3 py-2.5 font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const stage = getPipelineStage(company);
            const order = company.order;
            return (
              <tr
                key={company.id}
                className={cn(
                  "border-b border-white/5 transition-colors",
                  PIPELINE_ROW_CLASS[stage],
                )}
              >
                <td className="px-3 py-2.5 font-medium text-paper">
                  {showCompanyLink ? (
                    <Link
                      href={`/admin/clients/${company.id}`}
                      className="hover:text-accent-light"
                    >
                      {company.name}
                    </Link>
                  ) : (
                    company.name
                  )}
                </td>
                <td className="px-3 py-2.5 text-paper/70">{company.industry}</td>
                <td className="px-3 py-2.5 text-paper/70">{company.size}</td>
                <td className="px-3 py-2.5 text-paper/70">
                  {formatSurveyStatus(company.survey)}
                </td>
                <td className="px-3 py-2.5 text-paper/70">
                  {formatOrderStatus(order)}
                </td>
                <td className="px-3 py-2.5 text-paper/70">
                  {order?.product ?? "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-paper/70">
                  {order ? formatCents(order.amount) : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-muted">
                  {company.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/admin/clients/${company.id}`}
                      className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/80 hover:bg-white/5"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </Link>
                    {order ? (
                      <AdminActionButton
                        label="Redeliver"
                        path="/api/admin/redeliver"
                        body={{ orderId: order.id }}
                        confirmMessage="Regenerate all deliverables for this order?"
                      />
                    ) : null}
                    <AdminActionButton
                      label="Nudge"
                      path="/api/admin/nudge"
                      body={{ companyId: company.id }}
                    />
                    <a
                      href={getImpersonateDashboardUrl(company.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="MVP: opens client dashboard in a new tab. Full impersonation (session as client) is not implemented yet."
                      className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/80 hover:bg-white/5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Portal
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
