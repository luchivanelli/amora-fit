"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type LookupOrder = { id: string; number: number; createdAt: string; status: string; total: number; itemCount: number };

export type OrderLookupState = {
  error?: string;
  fieldErrors?: { email?: string; phone?: string };
  orders?: LookupOrder[];
  values?: { email: string; phone: string };
};

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
  phone: z.string().trim().min(6, "Escribí tu teléfono"),
});

/** Últimos 8 dígitos: así coincide aunque se haya escrito con +54, 9, 0 o 15. */
const phoneKey = (p: string) => p.replace(/\D/g, "").slice(-8);

/**
 * Busca los pedidos de una compra como invitada (o con cuenta) por mail + teléfono.
 * Pedimos los dos datos para que nadie pueda ver pedidos ajenos sabiendo solo un mail.
 */
export async function lookupOrders(_prev: OrderLookupState, formData: FormData): Promise<OrderLookupState> {
  const values = { email: String(formData.get("email") ?? ""), phone: String(formData.get("phone") ?? "") };

  const ip = await getClientIp();
  if (!rateLimit(`order-lookup:${ip}`, 10, 10 * 60 * 1000).ok) {
    return { values, error: "Hiciste muchas búsquedas seguidas. Probá de nuevo en unos minutos." };
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const fe: OrderLookupState["fieldErrors"] = {};
    for (const i of parsed.error.issues) fe[i.path[0] as "email" | "phone"] ??= i.message;
    return { values, fieldErrors: fe };
  }

  const key = phoneKey(parsed.data.phone);
  if (key.length < 6) return { values, fieldErrors: { phone: "Escribí tu teléfono completo" } };

  const rows = await prisma.order.findMany({
    where: { contactEmail: { equals: parsed.data.email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, number: true, createdAt: true, status: true, total: true, contactPhone: true, items: { select: { quantity: true } } },
  });

  const orders = rows
    .filter((o) => phoneKey(o.contactPhone) === key)
    .map((o) => ({
      id: o.id,
      number: o.number,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      total: Number(o.total),
      itemCount: o.items.reduce((a, i) => a + i.quantity, 0),
    }));

  if (orders.length === 0) {
    return { values, error: "No encontramos pedidos con ese mail y teléfono. Revisá que sean los mismos que usaste al comprar." };
  }
  return { values, orders };
}
