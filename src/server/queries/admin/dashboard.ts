import { prisma } from "@/lib/prisma";
import { getLowStockByProduct } from "@/server/queries/admin/products";
import { minLowStock } from "@/lib/stock";

export async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [newOrders, monthSales, lowStockMap, recentOrders, productCount, draftCount] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDIENTE_ACUERDO", "PENDIENTE_PAGO", "PAGADO"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        status: { in: ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"] },
        createdAt: { gte: monthStart },
      },
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

  return {
    newOrders,
    monthSalesTotal: Number(monthSales._sum.total ?? 0),
    monthSalesCount: monthSales._count,
    lowStock,
    lowStockCount: lowStockMap.size,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
    productCount,
    draftCount,
  };
}
