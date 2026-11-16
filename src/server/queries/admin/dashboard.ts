import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/lib/labels";

export async function getDashboardData() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [newOrders, monthSales, lowStockVariants, recentOrders, productCount, draftCount] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDIENTE_ACUERDO", "PENDIENTE_PAGO", "PAGADO"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: {
        status: { in: ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"] },
        createdAt: { gte: monthStart },
      },
    }),
    prisma.productVariant.findMany({
      where: {
        stock: { lte: LOW_STOCK_THRESHOLD },
        isActive: true,
        product: { deletedAt: null, status: "ACTIVE" },
      },
      select: {
        id: true,
        size: true,
        color: true,
        stock: true,
        product: { select: { id: true, name: true, images: { where: { isMain: true }, take: 1, select: { url: true } } } },
      },
      orderBy: { stock: "asc" },
      take: 30,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, contactName: true, total: true, status: true, paymentMethod: true, createdAt: true },
    }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: "DRAFT" } }),
  ]);

  // Agrupar poco stock por producto para que la lista sea corta y clara.
  const lowStockByProduct = new Map<string, { id: string; name: string; imageUrl: string | null; variants: { label: string; stock: number }[] }>();
  for (const v of lowStockVariants) {
    const entry = lowStockByProduct.get(v.product.id) ?? {
      id: v.product.id,
      name: v.product.name,
      imageUrl: v.product.images[0]?.url ?? null,
      variants: [],
    };
    entry.variants.push({ label: `${v.size} · ${v.color}`, stock: v.stock });
    lowStockByProduct.set(v.product.id, entry);
  }

  return {
    newOrders,
    monthSalesTotal: Number(monthSales._sum.total ?? 0),
    monthSalesCount: monthSales._count,
    lowStock: Array.from(lowStockByProduct.values()).slice(0, 8),
    lowStockCount: lowStockByProduct.size,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
    productCount,
    draftCount,
  };
}
