import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/server/queries/shop/cart";
import { isMercadoPagoConfigured } from "@/server/services/mercadopago";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const [session, cart] = await Promise.all([auth(), getCart()]);
  const available = cart.items.filter((i) => i.available);

  if (available.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Tu carrito está vacío"
          description={cart.items.length > 0 ? "Los productos que tenías se quedaron sin stock. ¡Perdón! Mirá otras opciones." : "Agregá algo que te guste y volvé para finalizar la compra."}
          action={<LinkButton href="/tienda">Ir a la tienda</LinkButton>}
        />
      </div>
    );
  }

  const [user, addresses] = session?.user?.id
    ? await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true } }),
        prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
      ])
    : [null, []];

  const flat = Number(process.env.SHIPPING_FLAT_RATE ?? 0) || null;
  const freeFrom = Number(process.env.FREE_SHIPPING_FROM ?? 0) || null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-medium">Finalizar compra</h1>
      <CheckoutForm
        cart={cart}
        user={user}
        addresses={addresses.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, street: a.street, apartment: a.apartment, city: a.city, province: a.province, zip: a.zip, isDefault: a.isDefault }))}
        mpEnabled={isMercadoPagoConfigured()}
        shipping={{ flat, freeFrom }}
      />
    </div>
  );
}
