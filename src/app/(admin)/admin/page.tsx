import { ClientPipelineTable } from "@/components/admin/client-pipeline-table";
import { KpiCards } from "@/components/admin/kpi-cards";
import { getAdminKpis, getAdminPipeline } from "@/lib/admin-data";

export default async function AdminOverviewPage() {
  const [kpis, companies] = await Promise.all([
    getAdminKpis(),
    getAdminPipeline(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Overview
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          Client pipeline &amp; operations KPIs
        </p>
      </header>

      <KpiCards data={kpis} />

      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">
          Client pipeline
        </h2>
        <ClientPipelineTable companies={companies} />
      </section>
    </div>
  );
}
