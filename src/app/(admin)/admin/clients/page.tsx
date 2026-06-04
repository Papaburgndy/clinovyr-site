import { ClientPipelineTable } from "@/components/admin/client-pipeline-table";
import { getAdminPipeline } from "@/lib/admin-data";

export default async function AdminClientsPage() {
  const companies = await getAdminPipeline();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Clients
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          All registered companies
        </p>
      </header>
      <ClientPipelineTable companies={companies} />
    </div>
  );
}
