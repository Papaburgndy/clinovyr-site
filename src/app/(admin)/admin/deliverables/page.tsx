import { Package } from "lucide-react";
import Link from "next/link";
import { getAdminRecentDeliverables } from "@/lib/admin-data";

export default async function AdminDeliverablesPage() {
  const rows = await getAdminRecentDeliverables();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Deliverables
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          Recently delivered packages
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="flex max-w-md flex-col items-start gap-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-8">
          <Package className="h-8 w-8 text-muted" aria-hidden />
          <p className="text-sm text-paper/70">
            No delivered orders yet. Trigger delivery from{" "}
            <Link
              href="/admin/orders"
              className="text-accent-light hover:underline"
            >
              Orders
            </Link>{" "}
            or per-client actions on{" "}
            <Link
              href="/admin/clients"
              className="text-accent-light hover:underline"
            >
              Clients
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.orderId}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${row.companyId}`}
                      className="text-paper hover:text-accent-light hover:underline"
                    >
                      {row.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-paper/70">
                    {row.product}
                  </td>
                  <td className="px-4 py-3 text-paper/70">{row.fileCount}</td>
                  <td className="px-4 py-3 font-mono text-xs text-paper/60">
                    {row.deliveredAt
                      ? row.deliveredAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-paper/60">Delivered</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-paper/50">
        Bulk regeneration queue is planned. Use client detail pages to re-deliver
        individual packages today.
      </p>
    </div>
  );
}
