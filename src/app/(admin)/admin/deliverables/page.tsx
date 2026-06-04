import { Package } from "lucide-react";
import Link from "next/link";

export default function AdminDeliverablesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Deliverables
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          Coming soon
        </p>
      </header>
      <div className="flex max-w-md flex-col items-start gap-4 rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-8">
        <Package className="h-8 w-8 text-muted" />
        <p className="text-sm text-paper/70">
          Global deliverables queue and bulk regeneration will live here. For
          now, manage files per client from{" "}
          <Link href="/admin/clients" className="text-accent-light hover:underline">
            Clients
          </Link>{" "}
          or re-trigger delivery from{" "}
          <Link href="/admin/orders" className="text-accent-light hover:underline">
            Orders
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
