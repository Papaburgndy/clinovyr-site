"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Lock,
  Menu,
  MessageSquare,
  Package,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const CALENDLY_DEFAULT = "https://calendly.com/clinovyr";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
};

export type PortalSidebarProps = {
  userName: string | null;
  companyName: string | null;
  planBadge: string;
  initials: string;
  isPaid: boolean;
  calendlyUrl?: string;
};

export function PortalSidebar({
  userName,
  companyName,
  planBadge,
  initials,
  isPaid,
  calendlyUrl = CALENDLY_DEFAULT,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    {
      href: "/dashboard/assessment",
      label: "My Assessment",
      icon: ClipboardList,
    },
    {
      href: "/dashboard/deliverables",
      label: "My Deliverables",
      icon: Package,
      locked: !isPaid,
    },
    {
      href: "/dashboard/agent",
      label: "AI Agent",
      icon: MessageSquare,
      locked: !isPaid,
    },
    {
      href: "/dashboard/settings",
      label: "Account Settings",
      icon: Settings,
    },
  ];

  const sidebarContent = (
    <>
      <div className="border-b border-rule/15 px-5 py-6">
        <Link
          href="/dashboard"
          className="font-display text-xl font-light tracking-tight text-paper transition-colors hover:text-accent-light"
          onClick={() => setMobileOpen(false)}
        >
          Clinovyr
        </Link>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45">
          Client Portal
        </p>
      </div>

      <div className="border-b border-rule/15 px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/30 font-mono text-sm text-accent-light"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-medium text-paper">
              {userName ?? "Client"}
            </p>
            {companyName ? (
              <p className="truncate font-sans text-xs text-paper/50">
                {companyName}
              </p>
            ) : null}
          </div>
        </div>
        <span className="mt-3 inline-block rounded-sm border border-accent/40 bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-light">
          {planBadge}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Portal navigation">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.locked) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-paper/35"
                title="Unlock by purchasing your assessment package"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                <span className="flex-1">{item.label}</span>
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent text-paper"
                  : "text-paper/70 hover:bg-paper/5 hover:text-paper",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-rule/15 p-4">
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-sm border border-rule/20 px-3 py-3 text-center font-sans text-xs text-paper/70 transition-colors hover:border-accent/40 hover:text-accent-light"
        >
          Need help? Book a call
        </a>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-sm border border-rule/20 bg-ink/95 text-paper lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/80 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-rule/15 bg-ink/95 backdrop-blur-sm transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-paper/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
