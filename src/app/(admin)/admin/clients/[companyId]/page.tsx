import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { AdminActionButton } from "@/components/admin/admin-actions";
import { SurveyResponsesPanel } from "@/components/admin/survey-responses-panel";
import {
  AdminTimeline,
  buildCompanyTimeline,
} from "@/components/admin/timeline";
import { formatCents, formatOrderStatus } from "@/lib/admin-data";
import { getImpersonateDashboardUrl } from "@/lib/admin-impersonate";
import { parseDeliverableRecords } from "@/lib/deliverables/parse-records";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { user: true, survey: true, order: true },
  });

  if (!company) {
    notFound();
  }

  const deliverables = company.order
    ? parseDeliverableRecords(company.order.deliverables)
    : [];
  const timeline = buildCompanyTimeline(company);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-accent-light"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to overview
        </Link>
        <h1 className="mt-3 font-display text-3xl font-light text-paper">
          {company.name}
        </h1>
        <p className="mt-1 text-sm text-paper/60">
          {company.industry} · {company.size} · {company.city}, {company.state}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
            User
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="text-paper">{company.user.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="text-paper">{company.user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Registered</dt>
              <dd className="font-mono text-xs text-paper/80">
                {company.user.createdAt.toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminActionButton
              label="Send nudge"
              path="/api/admin/nudge"
              body={{ companyId: company.id }}
            />
            <a
              href={getImpersonateDashboardUrl(company.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/80 hover:bg-white/5"
            >
              Open portal (MVP)
            </a>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
            Timeline
          </h2>
          <AdminTimeline events={timeline} />
        </section>
      </div>

      {company.survey ? (
        <section>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">
            Assessment
          </h2>
          <p className="mb-3 text-sm text-paper/70">
            Score: {company.survey.score ?? "—"} · Tier:{" "}
            {company.survey.tier ?? "—"} · Status: {company.survey.status}
          </p>
          <SurveyResponsesPanel responses={company.survey.responses} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
          Order
        </h2>
        {company.order ? (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-2 text-muted">Product</td>
                  <td className="px-4 py-2 text-paper">{company.order.product}</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-2 text-muted">Amount</td>
                  <td className="px-4 py-2 font-mono text-paper">
                    {formatCents(company.order.amount)}
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="px-4 py-2 text-muted">Status</td>
                  <td className="px-4 py-2 text-paper">
                    {formatOrderStatus(company.order)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-muted">Stripe payment</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-paper/70">
                    {company.order.stripePaymentId ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
              <AdminActionButton
                label="Mark delivered"
                path="/api/admin/mark-delivered"
                body={{ orderId: company.order.id }}
              />
              <AdminActionButton
                label="Redeliver"
                path="/api/admin/redeliver"
                body={{ orderId: company.order.id }}
                confirmMessage="Regenerate deliverables?"
              />
              {company.order.stripePaymentId ? (
                <AdminActionButton
                  label="Refund"
                  path="/api/admin/refund"
                  body={{ orderId: company.order.id }}
                  variant="danger"
                  confirmMessage="Issue a full Stripe refund for this order?"
                />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">No order yet.</p>
        )}
      </section>

      {deliverables.length > 0 ? (
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
            Deliverables
          </h2>
          <ul className="space-y-2">
            {deliverables.map((d) => (
              <li
                key={d.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/10 px-4 py-2.5"
              >
                <span className="text-sm text-paper">{d.name}</span>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent-light hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
