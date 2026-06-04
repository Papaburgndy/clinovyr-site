import type { Metadata } from "next";
import { AuthLogo } from "@/components/auth/auth-logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-grid-bg relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,158,136,0.12)_0%,transparent_55%)]"
        aria-hidden="true"
      />
      <header className="relative z-10 px-6 py-8 sm:px-10">
        <AuthLogo />
      </header>
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-4">
        {children}
      </div>
    </div>
  );
}
