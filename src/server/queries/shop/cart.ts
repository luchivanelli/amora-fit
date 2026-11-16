import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CART_COOKIE } from "@/lib/cart-cookie";

export type CartLineDTO = {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string | null;
  stock: number;
  available: boolean;
};

export type CartDTO = {
  id: string | null;
  items: CartLineDTO[];
  subtotal: number;
  count: number;
};

export const EMPTY_CART: CartDTO = { id: null, items: [], subtotal: 0, count: 0 };

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              status: true,
              deletedAt: true,
              images: { orderBy: [{ isMain: "desc" as const }, { position: "asc" as const }], take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  },
};

type CartRow = NonNullable<Awaited<ReturnType<typeof findCartRow>>>;

async function findCartRow(where: { id: string } | { token: string } | { userId: string }) {
  return prisma.cart.findUnique({ where: where as { id: string }, include: cartInclude });
}

export function toCartDTO(cart: CartRow | null): CartDTO {
  if (!cart) return EMPTY_CART;
  const items: CartLineDTO[] = cart.items.map((i) => {
    const p = i.variant.product;
    const unitPrice = Number(i.variant.price ?? p.price);
    const available = p.status === "ACTIVE" && !p.deletedAt && i.variant.isActive && i.variant.stock > 0;
    return {
      id: i.id,
      variantId: i.variantId,
      productId: p.id,
      productName: p.name,
      slug: p.slug,
      size: i.variant.size,
      color: i.variant.color,
      quantity: i.quantity,
      unitPrice,
      lineTotal: unitPrice * i.quantity,
      imageUrl: p.images[0]?.url ?? null,
      stock: i.variant.stock,
      available,
    };
  });
  return {
    id: cart.id,
    items,
    subtotal: items.filter((i) => i.available).reduce((a, i) => a + i.lineTotal, 0),
    count: items.reduce((a, i) => a + i.quantity, 0),
  };
}

/** Lee el carrito actual (usuario logueado o cookie de invitado). No crea nada. */
export async function getCart(): Promise<CartDTO> {
  const session = await auth();
  if (session?.user?.id) {
    const byUser = await prisma.cart.findUnique({ where: { userId: session.user.id }, include: cartInclude });
    if (byUser) return toCartDTO(byUser);
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return EMPTY_CART;
  const byToken = await prisma.cart.findUnique({ where: { token }, include: cartInclude });
  // Un carrito de otro usuario no se muestra a un invitado.
  if (byToken?.userId && byToken.userId !== session?.user?.id) return EMPTY_CART;
  return toCartDTO(byToken);
}

export { cartInclude };
