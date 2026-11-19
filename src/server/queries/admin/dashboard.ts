import { prisma } from "@/lib/prisma";
import { getLowStockByProduct } from "@/server/queries/admin/products";
import { minLowStock } from "@/lib/stock";

export async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Mismo tramo del mes anterior (del 1 al día de hoy) para comparar parejo.
  const prevMonthSameDay = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth(), Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate()), now.getHours(), now.getMinutes());
  const SOLD = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"] as const;

  const [newOrdersByStatus, monthSales, prevMonthSales, lowStockMap, recentOrders, productCount, draftCount] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { status: { in: ["PENDIENTE_ACUERDO", "PENDIENTE_PAGO", "PAGADO"] } }, _count: true }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { status: { in: [...SOLD] }, createdAt: { gte: monthStart } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: [...SOLD] }, createdAt: { gte: prevMonthStart, lt: prevMonthSameDay } },
    }),
    getLowStockByProduct(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, contactName: true, total: true, status: true, paymentMethod: true, createdAt: true },
    }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: "DRAFT" } }),
  ]);

  // Poco stock por talle + color, los más urgentes primero (agotados antes que los de 1).
  const urgentIds = Array.from(lowStockMap.entries())
    .sort(([, a], [, b]) => minLowStock(a) - minLowStock(b))
    .slice(0, 8)
    .map(([id]) => id);
  const products = await prisma.product.findMany({
    where: { id: { in: urgentIds } },
    select: { id: true, name: true, images: { where: { isMain: true }, take: 1, select: { url: true } } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lowStock = urgentIds.flatMap((id) => {
    const p = byId.get(id);
    return p ? [{ id: p.id, name: p.name, imageUrl: p.images[0]?.url ?? null, colors: lowStockMap.get(id) ?? [] }] : [];
  });

  const countOf = (s: string) => newOrdersByStatus.find((g) => g.status === s)?._count ?? 0;
  const newOrders = {
    total: newOrdersByStatus.reduce((a, g) => a + g._count, 0),
    toAgree: countOf("PENDIENTE_ACUERDO"),
    awaitingPayment: countOf("PENDIENTE_PAGO"),
    paid: countOf("PAGADO"),
  };

  const groups = Array.from(lowStockMap.values());
  const lowStockSummary = {
    products: lowStockMap.size,
    soldOutCombos: groups.flat().reduce((a, g) => a + g.sizes.filter((s) => s.stock === 0).length, 0),
    lastUnitCombos: groups.flat().reduce((a, g) => a + g.sizes.filter((s) => s.stock === 1).length, 0),
  };

  const monthSalesTotal = Number(monthSales._sum.total ?? 0);
  const prevTotal = Number(prevMonthSales._sum.total ?? 0);

  return {
    newOrders,
    monthSalesTotal,
    monthSalesCount: monthSales._count,
    monthAvgTicket: monthSales._count > 0 ? Math.round(monthSalesTotal / monthSales._count) : 0,
    /** % vs. el mismo tramo del mes anterior; null si el mes anterior no tuvo ventas. */
    monthChangePct: prevTotal > 0 ? Math.round(((monthSalesTotal - prevTotal) / prevTotal) * 100) : null,
    lowStock,
    lowStockSummary,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
    productCount,
    draftCount,
  };
}
