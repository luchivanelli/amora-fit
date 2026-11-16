import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, orderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Detalle del pedido", robots: { index: false } };

const STEPS = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"] as const;

export default async function MyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar");
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, userId: session.user.id }, include: { items: true } });
  if (!order) notFound();

  const num = orderNumber(order.number);
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "CANCELADO";
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const address = [order.shippingStreet, order.shippingCity, order.shippingProvince, order.shippingZip].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/cuenta/pedidos" className="text-[15px] text-ink-soft hover:text-ink">‹ Mis pedidos</Link>
          <h2 className="text-3xl font-medium">Pedido {num}</h2>
          <p className="text-sm text-ink-muted">{formatDate(order.createdAt, true)} · {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
        </div>
        <Badge tone={ORDER_STATUS_TONE[order.status]} className="text-sm">{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      {!cancelled && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Seguimiento">
          {STEPS.map((s, i) => {
            const done = stepIndex >= i;
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center">
                <span className={`h-1.5 w-full rounded-full ${done ? "bg-brand-600" : "bg-sand-dark"}`} />
                <span className={`text-xs font-medium sm:text-sm ${done ? "text-ink" : "text-ink-muted"}`}>{ORDER_STATUS_LABELS[s]}</span>
              </li>
            );
          })}
        </ol>
      )}

      {order.status === "PENDIENTE_ACUERDO" && wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola! Te escribo por mi pedido ${num}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 font-medium text-white hover:bg-[#1ebe5b] sm:self-start">
          <MessageCircle className="size-5" aria-hidden /> Coordinar por WhatsApp
        </a>
      )}

      <Card>
        <ul className="divide-y divide-sand">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">{i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/producto/${i.productSlug}`} className="block truncate font-medium hover:underline">{i.productName}</Link>
                <p className="text-sm text-ink-muted">{i.variantLabel} · {i.quantity} × {formatMoney(Number(i.unitPrice))}</p>
              </div>
              <span className="font-semibold">{formatMoney(Number(i.lineTotal))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1 border-t border-sand pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(Number(order.subtotal))}</dd></div>
          {Number(order.discount) > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Descuento</dt><dd>-{formatMoney(Number(order.discount))}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Envío</dt><dd>{order.shippingCost === null ? "A coordinar" : formatMoney(Number(order.shippingCost))}</dd></div>
          <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{formatMoney(Number(order.total))}</dd></div>
        </dl>
      </Card>

      <Card>
        <h3 className="mb-2 font-sans text-lg font-semibold">Entrega</h3>
        <p className="text-[15px]">{address || order.shippingZone || "A coordinar"}</p>
        <p className="text-sm text-ink-muted">{order.contactName} · {order.contactPhone}</p>
        {order.notes && <p className="mt-3 rounded-xl bg-sand/50 px-4 py-3 text-[15px]">{order.notes}</p>}
      </Card>
    </div>
  );
}
