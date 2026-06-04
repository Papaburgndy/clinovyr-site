"use client";

import { usePathname } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { PortalSidebar, type PortalSidebarProps } from "./portal-sidebar";

type PortalChromeProps = PortalSidebarProps & {
  children: React.ReactNode;
};

export function PortalChrome({ children, ...sidebarProps }: PortalChromeProps) {
  const pathname = usePathname();
  const hideSidebar = pathname.startsWith("/onboarding");

  if (hideSidebar) {
    return (
      <div className="auth-grid-bg relative flex min-h-screen flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,158,136,0.12)_0%,transparent_55%)]"
          aria-hidden="true"
        />
        <header className="relative z-10 px-6 py-8 sm:px-10">
          <AuthLogo />
        </header>
        <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-16 pt-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-grid-bg relative flex min-h-screen">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,158,136,0.12)_0%,transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full min-h-screen">
        <PortalSidebar {...sidebarProps} />
        <main className="flex min-h-screen flex-1 flex-col overflow-y-auto pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
