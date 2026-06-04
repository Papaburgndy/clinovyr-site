"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-actions";
import { formatCents } from "@/lib/admin-format";

export type AdminOrderRow = {
  id: string;
  product: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  stripePaymentId: string | null;
  companyId: string;
  companyName: string;
  userEmail: string;
};

const STATUSES = ["all", "pending", "paid", "delivered", "failed"] as const;

export function OrdersTable({
  orders,
  products,
}: {
  orders: AdminOrderRow[];
  products: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`/admin/orders?${next.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Status
          </span>
          <select
            value={searchParams.get("status") ?? "all"}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded border border-white/15 bg-ink px-2 py-1.5 text-sm text-paper"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Package
          </span>
          <select
            value={searchParams.get("product") ?? "all"}
            onChange={(e) => updateFilter("product", e.target.value)}
            className="max-w-xs rounded border border-white/15 bg-ink px-2 py-1.5 text-sm text-paper"
          >
            <option value="all">all</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            From
          </span>
          <input
            type="date"
            defaultValue={searchParams.get("from") ?? ""}
            onChange={(e) => updateFilter("from", e.target.value)}
            className="rounded border border-white/15 bg-ink px-2 py-1.5 text-sm text-paper"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            To
          </span>
          <input
            type="date"
            defaultValue={searchParams.get("to") ?? ""}
            onChange={(e) => updateFilter("to", e.target.value)}
            className="rounded border border-white/15 bg-ink px-2 py-1.5 text-sm text-paper"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2.5 font-normal">Date</th>
              <th className="px-3 py-2.5 font-normal">Company</th>
              <th className="px-3 py-2.5 font-normal">Package</th>
              <th className="px-3 py-2.5 font-normal">Amount</th>
              <th className="px-3 py-2.5 font-normal">Status</th>
              <th className="px-3 py-2.5 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center font-mono text-xs text-muted"
                >
                  No orders match filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/clients/${order.companyId}`}
                      className="text-paper hover:text-accent-light"
                    >
                      {order.companyName}
                    </Link>
                    <p className="font-mono text-[10px] text-muted">
                      {order.userEmail}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-paper/70">{order.product}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {formatCents(order.amount)}
                  </td>
                  <td className="px-3 py-2.5 capitalize text-paper/70">
                    {order.status}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {order.status !== "delivered" ? (
                        <AdminActionButton
                          label="Delivered"
                          path="/api/admin/mark-delivered"
                          body={{ orderId: order.id }}
                        />
                      ) : null}
                      <AdminActionButton
                        label="Redeliver"
                        path="/api/admin/redeliver"
                        body={{ orderId: order.id }}
                        confirmMessage="Re-trigger deliverable generation?"
                      />
                      {order.stripePaymentId ? (
                        <AdminActionButton
                          label="Refund"
                          path="/api/admin/refund"
                          body={{ orderId: order.id }}
                          variant="danger"
                          confirmMessage="Issue Stripe refund?"
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
