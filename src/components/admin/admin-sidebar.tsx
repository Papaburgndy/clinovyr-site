"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/deliverables", label: "Deliverables", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
        const active = isActive(
          pathname,
          href,
          "exact" in rest ? rest.exact : false,
        );
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
              active
                ? "bg-accent/20 text-accent-light"
                : "text-paper/60 hover:bg-white/5 hover:text-paper",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-md border border-white/10 bg-ink p-2 text-paper lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/80 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/10 bg-[#0a0c0f] transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          <div>
            <p className="font-display text-lg font-light tracking-tight text-paper">
              Clinovyr Admin
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              Operations
            </p>
          </div>
          <button
            type="button"
            className="rounded p-1 text-paper/60 hover:text-paper lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-accent-light"
          >
            ← Public site
          </Link>
        </div>
      </aside>
    </>
  );
}
