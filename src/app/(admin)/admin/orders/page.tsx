import { Suspense } from "react";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/orders-table";
import { getAdminOrders } from "@/lib/admin-data";
import { CLINOVYR_PRODUCTS } from "@/lib/products";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    product?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orders = await getAdminOrders({
    status: params.status,
    product: params.product,
    from: params.from,
    to: params.to,
  });

  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    product: o.product,
    amount: o.amount,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    stripePaymentId: o.stripePaymentId,
    companyId: o.company.id,
    companyName: o.company.name,
    userEmail: o.company.user.email,
  }));

  const products = Object.keys(CLINOVYR_PRODUCTS);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-light tracking-tight text-paper">
          Orders
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
          {rows.length} order{rows.length === 1 ? "" : "s"}
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-muted">Loading filters…</p>}>
        <OrdersTable orders={rows} products={products} />
      </Suspense>
    </div>
  );
}
