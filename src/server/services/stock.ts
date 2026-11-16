import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Devuelve al stock las unidades reservadas por un pedido (cancelación o vencimiento).
 * Idempotente: si ya se liberó, no hace nada.
 */
export async function releaseOrderStock(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { stockReserved: true, items: { select: { variantId: true, quantity: true } } },
  });
  if (!order || !order.stockReserved) return false;

  for (const item of order.items) {
    if (!item.variantId) continue;
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    });
    await tx.stockMovement.create({
      data: { variantId: item.variantId, delta: item.quantity, reason: "ORDER_RELEASED", orderId },
    });
  }
  await tx.order.update({ where: { id: orderId }, data: { stockReserved: false } });
  return true;
}
