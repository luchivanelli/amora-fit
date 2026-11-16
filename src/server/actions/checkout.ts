"use server";

import type { Coupon } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { auth } from "@/lib/auth";
import { MP_ORDER_TTL_MS } from "@/lib/cart-cookie";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok, zodFieldErrors, GENERIC_ERROR, type ActionResult } from "@/lib/action-result";
import { cleanText, orderNumber } from "@/lib/utils";
import { checkoutSchema, couponCodeSchema, type CheckoutInput } from "@/lib/validations/shop";
import { resolveCart } from "@/server/services/cart";
import { toCartDTO } from "@/server/queries/shop/cart";
import { createCheckoutPreference, isMercadoPagoConfigured } from "@/server/services/mercadopago";
import { deliveryText, expireStaleOrders, notifyCustomerOrder, notifySellerNewOrder } from "@/server/services/orders";
import { releaseOrderStock } from "@/server/services/stock";

/* ───────── Cupones ───────── */

export type CouponPreview = { code: string; type: "PERCENTAGE" | "FIXED"; value: number; discount: number; description: string | null };

function couponError(c: Coupon | null, subtotal: number): string | null {
  const now = new Date();
  if (!c || !c.isActive) return "Ese cupón no existe o ya no está vigente.";
  if (c.startsAt && c.startsAt > now) return "Ese cupón todavía no está vigente.";
  if (c.expiresAt && c.expiresAt < now) return "Ese cupón ya venció.";
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return "Ese cupón ya alcanzó su límite de usos.";
  if (c.minSubtotal !== null && subtotal < Number(c.minSubtotal)) return `Ese cupón vale para compras desde $${Number(c.minSubtotal).toLocaleString("es-AR")}.`;
  return null;
}

function computeDiscount(c: Coupon, subtotal: number) {
  const value = Number(c.value);
  const raw = c.type === "PERCENTAGE" ? (subtotal * value) / 100 : value;
  return Math.min(subtotal, Math.round(raw));
}

export async function validateCoupon(code: string): Promise<ActionResult<CouponPreview>> {
  try {
    const parsed = couponCodeSchema.safeParse(code);
    if (!parsed.success) return fail("Escribí el código del cupón.");
    const cart = await resolveCart(false);
    const subtotal = toCartDTO(cart).subtotal;
    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data } });
    const error = couponError(coupon, subtotal);
    if (error || !coupon) return fail(error ?? GENERIC_ERROR);
    return ok({ code: coupon.code, type: coupon.type, value: Number(coupon.value), discount: computeDiscount(coupon, subtotal), description: coupon.description });
  } catch (e) {
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}

/* ───────── Envío ───────── */

function shippingForPaidOrder(amount: number): number | null {
  const flat = Number(process.env.SHIPPING_FLAT_RATE ?? 0);
  if (!flat || flat <= 0) return null; // a coordinar
  const freeFrom = Number(process.env.FREE_SHIPPING_FROM ?? 0);
  if (freeFrom > 0 && amount >= freeFrom) return 0;
  return flat;
}

/* ───────── Pedido ───────── */

class StockError extends Error {
  constructor(public productName: string) {
    super("STOCK");
  }
}

export async function placeOrder(input: CheckoutInput): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const ip = await getClientIp();
    if (!rateLimit(`checkout:${ip}`, 10, 10 * 60 * 1000).ok) {
      return fail("Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.");
    }

    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) return fail("Revisá los datos marcados.", zodFieldErrors(parsed.error.issues));
    const data = parsed.data;

    if (data.paymentMethod === "MERCADO_PAGO" && !isMercadoPagoConfigured()) {
      return fail("Mercado Pago no está disponible en este momento. Podés elegir “Acordar con la vendedora”.", { paymentMethod: "Elegí otra forma de pago" });
    }

    const session = await auth();
    const cartRow = await resolveCart(false);
    const cart = toCartDTO(cartRow);
    const lines = cart.items.filter((i) => i.available);
    if (!cartRow || lines.length === 0) return fail("Tu carrito está vacío.");

    await expireStaleOrders().catch(() => 0);

    const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);

    let coupon: Coupon | null = null;
    let discount = 0;
    if (data.couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode } });
      const err = couponError(coupon, subtotal);
      if (err || !coupon) return fail(err ?? GENERIC_ERROR, { couponCode: err ?? GENERIC_ERROR });
      discount = computeDiscount(coupon, subtotal);
    }

    const isMP = data.paymentMethod === "MERCADO_PAGO";
    const shippingCost = isMP ? shippingForPaidOrder(subtotal - discount) : null;
    const total = subtotal - discount + (shippingCost ?? 0);
    const expiresAt = isMP ? new Date(Date.now() + MP_ORDER_TTL_MS) : null;

    const shipping =
      data.deliveryMode === "address"
        ? {
            shippingStreet: cleanText([data.street, data.apartment].filter(Boolean).join(", ")),
            shippingCity: cleanText(data.city ?? ""),
            shippingProvince: cleanText(data.province ?? ""),
            shippingZip: cleanText(data.zip ?? ""),
            shippingZone: null,
          }
        : { shippingStreet: null, shippingCity: null, shippingProvince: null, shippingZip: null, shippingZone: cleanText(data.zone ?? "") };

    const order = await prisma.$transaction(async (tx) => {
      // Reserva de stock: solo descuenta si hay suficiente (evita sobreventa aunque dos compren a la vez).
      for (const l of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: l.variantId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (updated.count === 0) throw new StockError(`${l.productName} (${l.size} · ${l.color})`);
      }

      const created = await tx.order.create({
        data: {
          userId: session?.user?.id ?? null,
          status: isMP ? "PENDIENTE_PAGO" : "PENDIENTE_ACUERDO",
          paymentMethod: data.paymentMethod,
          contactName: cleanText(data.contactName),
          contactPhone: cleanText(data.contactPhone),
          contactEmail: data.contactEmail,
          ...shipping,
          notes: data.notes ? cleanText(data.notes) : null,
          subtotal,
          discount,
          shippingCost,
          total,
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? null,
          stockReserved: true,
          expiresAt,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              productSlug: l.slug,
              variantLabel: `Talle ${l.size} · ${l.color}`,
              sku: cartRow.items.find((i) => i.id === l.id)?.variant.sku ?? "",
              imageUrl: l.imageUrl,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      await tx.stockMovement.createMany({
        data: lines.map((l) => ({ variantId: l.variantId, delta: -l.quantity, reason: "ORDER_RESERVED" as const, orderId: created.id })),
      });

      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });

      await tx.cartItem.deleteMany({ where: { cartId: cartRow.id } });

      if (session?.user?.id && data.saveAddress && data.deliveryMode === "address") {
        const count = await tx.address.count({ where: { userId: session.user.id } });
        await tx.address.create({
          data: {
            userId: session.user.id,
            fullName: cleanText(data.contactName),
            phone: cleanText(data.contactPhone),
            street: cleanText(data.street ?? ""),
            apartment: data.apartment ? cleanText(data.apartment) : null,
            city: cleanText(data.city ?? ""),
            province: cleanText(data.province ?? ""),
            zip: cleanText(data.zip ?? ""),
            isDefault: count === 0,
          },
        });
      }

      return created;
    });

    // El stock cambió: las páginas de la tienda deben reflejarlo.
    revalidateTag(TAGS.products);

    const emailPayload = {
      id: order.id,
      number: order.number,
      contactName: order.contactName,
      contactPhone: order.contactPhone,
      contactEmail: order.contactEmail,
      paymentMethod: order.paymentMethod,
      subtotal,
      discount,
      shippingCost,
      total,
      notes: order.notes,
      deliveryText: deliveryText(order),
      items: order.items.map((i) => ({ productName: i.productName, variantLabel: i.variantLabel, quantity: i.quantity, lineTotal: Number(i.lineTotal) })),
    };

    if (isMP) {
      try {
        const pref = await createCheckoutPreference({
          orderId: order.id,
          orderNumber: orderNumber(order.number),
          items: order.items.map((i) => ({ title: `${i.productName} · ${i.variantLabel}`, quantity: i.quantity, unitPrice: Number(i.unitPrice), imageUrl: i.imageUrl })),
          shippingCost,
          discount,
          payer: { name: order.contactName, email: order.contactEmail },
          expiresAt: expiresAt!,
        });
        await prisma.payment.create({
          data: { orderId: order.id, preferenceId: pref.preferenceId, amount: total, externalRef: order.id, status: "PENDING" },
        });
        return ok({ redirectTo: pref.initPoint });
      } catch (e) {
        console.error("Error creando preferencia de Mercado Pago:", e);
        await prisma.$transaction(async (tx) => {
          await releaseOrderStock(tx, order.id);
          await tx.order.update({ where: { id: order.id }, data: { status: "CANCELADO", cancelledAt: new Date() } });
        });
        return fail("No pudimos conectar con Mercado Pago. Probá de nuevo o elegí “Acordar con la vendedora”.");
      }
    }

    await Promise.allSettled([notifySellerNewOrder(emailPayload), notifyCustomerOrder(emailPayload)]);
    return ok({ redirectTo: `/checkout/confirmacion/${order.id}` });
  } catch (e) {
    if (e instanceof StockError) {
      return fail(`Justo se agotó ${e.productName}. Revisá tu carrito y volvé a intentar.`);
    }
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}
