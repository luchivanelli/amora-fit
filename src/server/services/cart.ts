import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CART_COOKIE, CART_COOKIE_MAX_AGE, MAX_QTY_PER_LINE } from "@/lib/cart-cookie";
import { cartInclude } from "@/server/queries/shop/cart";

export async function setCartCookie(token: string) {
  (await cookies()).set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Devuelve el carrito del usuario o del invitado, creándolo si hace falta.
 * Si una invitada se loguea, su carrito de cookie se fusiona con el de su cuenta.
 * Solo se llama desde Server Actions (necesita poder escribir la cookie).
 */
export async function resolveCart(create: boolean) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value ?? null;

  const byToken = token ? await prisma.cart.findUnique({ where: { token }, include: cartInclude }) : null;

  if (userId) {
    const byUser = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
    const guestCart = byToken && !byToken.userId ? byToken : null;

    if (byUser && guestCart) {
      for (const gi of guestCart.items) {
        const existing = byUser.items.find((i) => i.variantId === gi.variantId);
        if (existing) {
          await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(MAX_QTY_PER_LINE, existing.quantity + gi.quantity) } });
        } else {
          await prisma.cartItem.create({ data: { cartId: byUser.id, variantId: gi.variantId, quantity: gi.quantity } });
        }
      }
      await prisma.cart.delete({ where: { id: guestCart.id } });
      await setCartCookie(byUser.token);
      return prisma.cart.findUnique({ where: { id: byUser.id }, include: cartInclude });
    }
    if (byUser) {
      if (token !== byUser.token) await setCartCookie(byUser.token);
      return byUser;
    }
    if (guestCart) {
      return prisma.cart.update({ where: { id: guestCart.id }, data: { userId }, include: cartInclude });
    }
    if (!create) return null;
    const created = await prisma.cart.create({ data: { userId }, include: cartInclude });
    await setCartCookie(created.token);
    return created;
  }

  if (byToken && !byToken.userId) return byToken;
  if (!create) return null;
  const created = await prisma.cart.create({ data: {}, include: cartInclude });
  await setCartCookie(created.token);
  return created;
}
