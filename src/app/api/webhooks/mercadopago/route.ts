import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { fetchPayment, verifyWebhookSignature } from "@/server/services/mercadopago";
import { deliveryText, expireStaleOrders, notifyCustomerOrder, notifySellerNewOrder } from "@/server/services/orders";
import { releaseOrderStock } from "@/server/services/stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MP_TO_LOCAL: Record<string, PaymentStatus> = {
  approved: "APPROVED",
  authorized: "IN_PROCESS",
  in_process: "IN_PROCESS",
  in_mediation: "IN_PROCESS",
  pending: "PENDING",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  charged_back: "REFUNDED",
};

/**
 * Única API route del proyecto: Mercado Pago avisa acá cuando cambia un pago.
 * 1) Verificamos la firma. 2) Consultamos el pago a MP (nunca confiamos en el body).
 * 3) Comprobamos que el monto coincida. 4) Actualizamos Payment y Order.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await req.json();
  } catch {}

  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";

  const valid = verifyWebhookSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "firma inválida" }, { status: 401 });

  // Solo nos interesan pagos. Otros eventos (merchant_order, etc.) se aceptan y se ignoran.
  if (type !== "payment" || !dataId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const payment = await fetchPayment(dataId);
    const orderId = payment.external_reference;
    const mpStatus = payment.status ?? "pending";
    if (!orderId) return NextResponse.json({ ok: true, ignored: true });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
    if (!order || order.paymentMethod !== "MERCADO_PAGO") return NextResponse.json({ ok: true, ignored: true });

    const amountMatches = Math.abs(Number(payment.transaction_amount ?? 0) - Number(order.total)) < 1;
    const localStatus = MP_TO_LOCAL[mpStatus] ?? "PENDING";

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { mpPaymentId: String(payment.id), status: localStatus, statusDetail: payment.status_detail ?? null, rawPayload: payment as object, approvedAt: mpStatus === "approved" ? new Date() : undefined },
      create: { orderId: order.id, mpPaymentId: String(payment.id), status: localStatus, statusDetail: payment.status_detail ?? null, amount: Number(payment.transaction_amount ?? order.total), externalRef: order.id, rawPayload: payment as object },
    });

    if (mpStatus === "approved") {
      if (!amountMatches) {
        console.error(`Webhook MP: monto no coincide para ${order.id}. MP=${payment.transaction_amount} local=${order.total}`);
        await prisma.order.update({ where: { id: order.id }, data: { adminNotes: `⚠️ Mercado Pago informó un pago de $${payment.transaction_amount} pero el pedido es de $${order.total}. Revisar antes de enviar.` } });
        return NextResponse.json({ ok: true, flagged: true });
      }
      if (order.status === "PENDIENTE_PAGO") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "PAGADO", paidAt: new Date(), expiresAt: null } });
        const payload = {
          id: order.id,
          number: order.number,
          contactName: order.contactName,
          contactPhone: order.contactPhone,
          contactEmail: order.contactEmail,
          paymentMethod: order.paymentMethod,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shippingCost: order.shippingCost === null ? null : Number(order.shippingCost),
          total: Number(order.total),
          notes: order.notes,
          deliveryText: deliveryText(order),
          items: order.items.map((i) => ({ productName: i.productName, variantLabel: i.variantLabel, quantity: i.quantity, lineTotal: Number(i.lineTotal) })),
        };
        await Promise.allSettled([notifySellerNewOrder(payload), notifyCustomerOrder(payload)]);
      }
    } else if ((mpStatus === "refunded" || mpStatus === "charged_back") && order.status !== "CANCELADO") {
      await prisma.$transaction(async (tx) => {
        await releaseOrderStock(tx, order.id);
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELADO", cancelledAt: new Date(), adminNotes: "Pago devuelto desde Mercado Pago." } });
      });
    }
    // rejected / cancelled: el pedido sigue PENDIENTE_PAGO hasta que venza (24 h) y libere el stock.

    const expired = await expireStaleOrders().catch(() => 0);
    if (expired > 0 || mpStatus === "refunded" || mpStatus === "charged_back") revalidateTag(TAGS.products);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook Mercado Pago:", e);
    // 500 hace que MP reintente más tarde.
    return NextResponse.json({ error: "error procesando" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
