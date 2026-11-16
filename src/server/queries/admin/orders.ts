import type { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ORDERS_PAGE_SIZE = 25;

export type OrderListItem = {
  id: string;
  number: number;
  contactName: string;
  contactPhone: string;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  itemCount: number;
};

export async function listOrders(params: { estado?: string; metodo?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.OrderWhereInput = {};

  if (params.estado === "nuevos") where.status = { in: ["PENDIENTE_ACUERDO", "PENDIENTE_PAGO", "PAGADO"] };
  else if (params.estado && params.estado !== "todos") where.status = params.estado as OrderStatus;

  if (params.metodo === "MERCADO_PAGO" || params.metodo === "ACORDAR_CON_VENDEDOR") where.paymentMethod = params.metodo;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: {
        id: true,
        number: true,
        contactName: true,
        contactPhone: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const items: OrderListItem[] = rows.map((o) => ({
    id: o.id,
    number: o.number,
    contactName: o.contactName,
    contactPhone: o.contactPhone,
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
    itemCount: o._count.items,
  }));

  return { items, total, page, hasMore: page * ORDERS_PAGE_SIZE < total };
}

export async function getOrderDetail(id: string) {
  const o = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { productName: "asc" } },
      payment: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!o) return null;
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    paymentMethod: o.paymentMethod,
    contactName: o.contactName,
    contactPhone: o.contactPhone,
    contactEmail: o.contactEmail,
    shipping: {
      street: o.shippingStreet,
      city: o.shippingCity,
      province: o.shippingProvince,
      zip: o.shippingZip,
      zone: o.shippingZone,
    },
    notes: o.notes,
    adminNotes: o.adminNotes,
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    shippingCost: o.shippingCost === null ? null : Number(o.shippingCost),
    total: Number(o.total),
    couponCode: o.couponCode,
    stockReserved: o.stockReserved,
    paidAt: o.paidAt?.toISOString() ?? null,
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    isGuest: !o.userId,
    payment: o.payment
      ? { status: o.payment.status, mpPaymentId: o.payment.mpPaymentId, amount: Number(o.payment.amount), approvedAt: o.payment.approvedAt?.toISOString() ?? null }
      : null,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      imageUrl: i.imageUrl,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    })),
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
