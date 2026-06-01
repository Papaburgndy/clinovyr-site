"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
];

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-rule bg-ink text-paper">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/dashboard" className="font-display text-xl font-semibold">
          Clinovyr
        </Link>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-white/50">
          Client Dashboard
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-paper"
                  : "text-white/70 hover:bg-white/10 hover:text-paper"
              )}
            >
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-gold text-ink"
                : "text-white/70 hover:bg-white/10 hover:text-paper"
            )}
          >
            Admin
          </Link>
        )}
      </nav>
    </aside>
  );
}
