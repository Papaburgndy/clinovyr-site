import { Prisma, type Company, Order, Survey, User } from "@prisma/client";
import { isOrderPaid, isSurveyComplete } from "@/lib/dashboard-state";
import { prisma } from "@/lib/prisma";

export type PipelineStage =
  | "survey-incomplete"
  | "survey-complete-no-order"
  | "paid-delivering"
  | "delivered";

export type CompanyWithRelations = Company & {
  user: User;
  survey: Survey | null;
  order: Order | null;
};

export function getPipelineStage(
  company: Pick<CompanyWithRelations, "survey" | "order">,
): PipelineStage {
  if (!isSurveyComplete(company.survey)) {
    return "survey-incomplete";
  }

  const order = company.order;
  if (!order || !isOrderPaid(order)) {
    return "survey-complete-no-order";
  }

  if (order.status === "delivered") {
    return "delivered";
  }

  return "paid-delivering";
}

export const PIPELINE_ROW_CLASS: Record<PipelineStage, string> = {
  "survey-incomplete": "border-l-4 border-l-amber-500/80 bg-amber-500/5",
  "survey-complete-no-order": "border-l-4 border-l-yellow-500/80 bg-yellow-500/5",
  "paid-delivering": "border-l-4 border-l-sky-500/80 bg-sky-500/5",
  delivered: "border-l-4 border-l-emerald-500/80 bg-emerald-500/5",
};

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getAdminKpis() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [
    totalUsers,
    surveysThisWeek,
    ordersThisMonth,
    deliverablesThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.survey.count({
      where: {
        status: "complete",
        completedAt: { gte: weekStart },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["paid", "delivered"] },
        OR: [
          { paidAt: { gte: monthStart } },
          { createdAt: { gte: monthStart } },
        ],
      },
      select: { amount: true },
    }),
    prisma.order.count({
      where: {
        status: "delivered",
        deliveredAt: { gte: monthStart },
      },
    }),
  ]);

  const ordersCount = ordersThisMonth.length;
  const ordersRevenueCents = ordersThisMonth.reduce(
    (sum, o) => sum + o.amount,
    0,
  );

  return {
    totalUsers,
    surveysThisWeek,
    ordersThisMonth: { count: ordersCount, revenueCents: ordersRevenueCents },
    deliverablesThisMonth,
  };
}

export async function getAdminPipeline(): Promise<CompanyWithRelations[]> {
  return prisma.company.findMany({
    include: { user: true, survey: true, order: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminCompany(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: { user: true, survey: true, order: true },
  });
}

export type AdminDeliverableRow = {
  orderId: string;
  companyId: string;
  companyName: string;
  product: string;
  fileCount: number;
  deliveredAt: Date | null;
};

export async function getAdminRecentDeliverables(
  limit = 25,
): Promise<AdminDeliverableRow[]> {
  const orders = await prisma.order.findMany({
    where: { status: "delivered" },
    include: { company: true },
    orderBy: { deliveredAt: "desc" },
    take: limit,
  });

  return orders.map((order) => {
    const deliverables = Array.isArray(order.deliverables)
      ? order.deliverables
      : [];
    return {
      orderId: order.id,
      companyId: order.companyId,
      companyName: order.company.name,
      product: order.product,
      fileCount: deliverables.length,
      deliveredAt: order.deliveredAt,
    };
  });
}

export async function getAdminOrders(filters?: {
  status?: string;
  product?: string;
  from?: string;
  to?: string;
}) {
  const where: Prisma.OrderWhereInput = {};

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.product && filters.product !== "all") {
    where.product = filters.product;
  }

  if (filters?.from || filters?.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = new Date(filters.from);
    }
    if (filters.to) {
      const to = new Date(filters.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  return prisma.order.findMany({
    where,
    include: {
      company: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export { formatCents, formatOrderStatus, formatSurveyStatus } from "@/lib/admin-format";
