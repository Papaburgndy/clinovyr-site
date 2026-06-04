import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeliverablesGrid } from "@/components/portal/deliverables/deliverables-grid";
import { GeneratingScreen } from "@/components/portal/deliverables/generating-screen";
import { requireAuth } from "@/lib/auth-helpers";
import { parseDeliverableRecords } from "@/lib/deliverables/parse-records";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Deliverables",
  description: "Access your Clinovyr deliverables.",
};

export default async function DeliverablesPage() {
  const session = await requireAuth();

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    include: { order: true },
  });

  if (!company) {
    redirect("/onboarding");
  }

  const order = company.order;

  if (!order || order.status === "pending") {
    redirect("/dashboard/results");
  }

  if (order.status === "paid") {
    return (
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <GeneratingScreen />
      </div>
    );
  }

  if (order.status === "delivered") {
    const deliverables = parseDeliverableRecords(order.deliverables);

    return (
      <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <DeliverablesGrid
          packageName={order.product}
          deliveredAt={order.deliveredAt}
          deliverables={deliverables}
        />
      </div>
    );
  }

  redirect("/dashboard/results");
}
