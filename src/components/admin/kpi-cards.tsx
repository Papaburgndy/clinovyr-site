import {
  FileCheck2,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { formatCents } from "@/lib/admin-format";
import { cn } from "@/lib/utils";

export type AdminKpiData = {
  totalUsers: number;
  surveysThisWeek: number;
  ordersThisMonth: { count: number; revenueCents: number };
  deliverablesThisMonth: number;
};

const CARDS = [
  {
    key: "users" as const,
    label: "Registered users",
    icon: Users,
    accent: "text-accent-light",
  },
  {
    key: "surveys" as const,
    label: "Surveys this week",
    icon: FileCheck2,
    accent: "text-gold",
  },
  {
    key: "orders" as const,
    label: "Orders this month",
    icon: ShoppingBag,
    accent: "text-sky-400",
  },
  {
    key: "deliverables" as const,
    label: "Delivered this month",
    icon: Package,
    accent: "text-emerald-400",
  },
];

export function KpiCards({ data }: { data: AdminKpiData }) {
  const values: Record<(typeof CARDS)[number]["key"], string> = {
    users: String(data.totalUsers),
    surveys: String(data.surveysThisWeek),
    orders: `${data.ordersThisMonth.count} · ${formatCents(data.ordersThisMonth.revenueCents)}`,
    deliverables: String(data.deliverablesThisMonth),
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, accent }) => (
        <div
          key={key}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {label}
            </p>
            <Icon className={cn("h-4 w-4 shrink-0", accent)} />
          </div>
          <p className="mt-2 font-display text-2xl font-light text-paper">
            {values[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
