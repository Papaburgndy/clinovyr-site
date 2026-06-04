import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin | Clinovyr",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-ink font-sans text-paper">
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden lg:pl-0">
          <div className="mx-auto max-w-[1400px] px-4 py-6 pt-16 lg:px-8 lg:py-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
