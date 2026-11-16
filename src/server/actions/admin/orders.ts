"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";
import { adminNotesSchema, agreedShippingSchema, updateOrderStatusSchema } from "@/lib/validations/admin/order";
import { releaseOrderStock } from "@/server/services/stock";

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  console.error(e);
  return fail(GENERIC_ERROR);
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin");
  revalidatePath(`/cuenta/pedidos`);
}

export async function updateOrderStatus(input: { orderId: string; status: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = updateOrderStatusSchema.safeParse(input);
    if (!parsed.success) return fail("Ese estado no es válido.");
    const { orderId, status } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, paidAt: true } });
    if (!order) return fail("Ese pedido ya no existe.");
    if (order.status === "CANCELADO" && status !== "CANCELADO") {
      return fail("Un pedido cancelado no se puede reabrir. Si hace falta, el cliente puede hacer uno nuevo.");
    }

    await prisma.$transaction(async (tx) => {
      const data: { status: typeof status; paidAt?: Date; cancelledAt?: Date } = { status };
      if (["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"].includes(status) && !order.paidAt) data.paidAt = new Date();
      if (status === "CANCELADO") {
        data.cancelledAt = new Date();
        await releaseOrderStock(tx, orderId);
      }
      await tx.order.update({ where: { id: orderId }, data });
    });

    revalidateOrder(orderId);
    revalidatePath("/admin/productos");
    if (status === "CANCELADO") revalidateTag(TAGS.products); // el stock volvió a la tienda
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** Para pedidos "a acordar": marca el pago como recibido. */
export async function markOrderPaid(orderId: string): Promise<ActionResult> {
  return updateOrderStatus({ orderId, status: "PAGADO" });
}

/** Carga (o borra) el costo de envío acordado y recalcula el total. */
export async function setAgreedShipping(input: { orderId: string; shippingCost: number | null }): Promise<ActionResult<{ total: number }>> {
  try {
    await requireAdmin();
    const parsed = agreedShippingSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá el costo de envío.");

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: { subtotal: true, discount: true, payment: { select: { id: true } } },
    });
    if (!order) return fail("Ese pedido ya no existe.");

    const total = Number(order.subtotal) - Number(order.discount) + (parsed.data.shippingCost ?? 0);
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { shippingCost: parsed.data.shippingCost, total },
    });

    revalidateOrder(parsed.data.orderId);
    return ok({ total });
  } catch (e) {
    return handleError(e);
  }
}

export async function saveAdminNotes(input: { orderId: string; adminNotes: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = adminNotesSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá la nota.");
    await prisma.order.update({ where: { id: parsed.data.orderId }, data: { adminNotes: parsed.data.adminNotes || null } });
    revalidateOrder(parsed.data.orderId);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
