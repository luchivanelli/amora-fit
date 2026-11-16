"use server";

import { prisma } from "@/lib/prisma";
import { MAX_QTY_PER_LINE } from "@/lib/cart-cookie";
import { fail, ok, GENERIC_ERROR, type ActionResult } from "@/lib/action-result";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validations/shop";
import { cartInclude, toCartDTO, type CartDTO } from "@/server/queries/shop/cart";
import { resolveCart } from "@/server/services/cart";

export async function addToCart(input: { variantId: string; quantity: number }): Promise<ActionResult<CartDTO>> {
  try {
    const parsed = addToCartSchema.safeParse(input);
    if (!parsed.success) return fail("Elegí talle y color antes de agregar.");
    const { variantId, quantity } = parsed.data;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, isActive: true, product: { select: { status: true, deletedAt: true } } },
    });
    if (!variant || !variant.isActive || variant.product.status !== "ACTIVE" || variant.product.deletedAt) {
      return fail("Ese producto ya no está disponible.");
    }

    const cart = await resolveCart(true);
    if (!cart) return fail(GENERIC_ERROR);

    const existing = cart.items.find((i) => i.variantId === variantId);
    const wanted = Math.min(MAX_QTY_PER_LINE, (existing?.quantity ?? 0) + quantity);
    if (variant.stock < wanted) {
      return fail(variant.stock === 0 ? "Justo se agotó ese talle y color." : `Solo quedan ${variant.stock} ${variant.stock === 1 ? "unidad" : "unidades"} de ese talle y color.`);
    }

    if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: wanted } });
    else await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity: wanted } });

    const fresh = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    return ok(toCartDTO(fresh));
  } catch (e) {
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}

export async function updateCartItem(input: { itemId: string; quantity: number }): Promise<ActionResult<CartDTO>> {
  try {
    const parsed = updateCartItemSchema.safeParse(input);
    if (!parsed.success) return fail(GENERIC_ERROR);
    const cart = await resolveCart(false);
    if (!cart) return fail("Tu carrito está vacío.");
    const item = cart.items.find((i) => i.id === parsed.data.itemId);
    if (!item) return fail("Ese producto ya no está en tu carrito.");

    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      if (item.variant.stock < parsed.data.quantity) {
        return fail(`Solo quedan ${item.variant.stock} ${item.variant.stock === 1 ? "unidad" : "unidades"} de ese talle y color.`);
      }
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
    }
    const fresh = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    return ok(toCartDTO(fresh));
  } catch (e) {
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}

export async function removeCartItem(itemId: string): Promise<ActionResult<CartDTO>> {
  return updateCartItem({ itemId, quantity: 0 });
}

/** Sincroniza el carrito tras iniciar sesión (fusiona el de invitada con el de la cuenta). */
export async function syncCart(): Promise<ActionResult<CartDTO>> {
  try {
    const cart = await resolveCart(false);
    return ok(toCartDTO(cart));
  } catch (e) {
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}
