import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, Mail, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney, orderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { LinkButton } from "@/components/ui/button";
import { emailsEnabled } from "@/lib/features";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const num = orderNumber(order.number);
  const agreed = order.paymentMethod === "ACORDAR_CON_VENDEDOR";
  const paid = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"].includes(order.status);
  const firstName = order.contactName.split(" ")[0];
  const total = Number(order.total);

  const summaryLines = order.items.map((i) => `• ${i.quantity} × ${i.productName} (${i.variantLabel})`).join("\n");
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const waMessage = `¡Hola! Soy ${order.contactName}. Acabo de hacer el pedido ${num} en la tienda:\n${summaryLines}\nTotal: ${formatMoney(total)}${order.shippingCost === null ? " (envío a coordinar)" : ""}.\n¿Coordinamos el pago y la entrega?`;
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null;

  const sellerEmail = process.env.SELLER_EMAIL;
  const mailHref = sellerEmail
    ? `mailto:${sellerEmail}?subject=${encodeURIComponent(`Pedido ${num} · ${order.contactName}`)}&body=${encodeURIComponent(waMessage)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          {paid ? <CheckCircle2 className="size-8" aria-hidden /> : <Clock className="size-8" aria-hidden />}
        </span>
        <h1 className="mt-5 text-4xl font-medium">{paid ? `¡Gracias, ${firstName}!` : `¡Listo, ${firstName}!`}</h1>
        <p className="mt-2 text-lg text-ink-soft">
          Tu pedido <strong className="text-ink">{num}</strong> {paid ? "está confirmado y pagado." : agreed ? "quedó registrado." : "está esperando el pago."}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {emailsEnabled()
            ? `Te mandamos un mail a ${order.contactEmail} con el detalle.`
            : "Guardá esta página o sacale una captura para tener el detalle de tu pedido."}
        </p>
      </div>

      {agreed && !paid && (
        <div className="mt-8 rounded-3xl bg-brand-50 p-6 text-center">
          <h2 className="text-2xl font-medium">Ahora coordinamos juntas</h2>
          <p className="mt-2 text-[15px] text-ink-soft">
            Escribinos por WhatsApp con el resumen ya armado y te contamos cómo pagar y cuánto cuesta el envío a tu zona.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-lg font-medium text-white shadow-sm hover:bg-[#1ebe5b]">
                <MessageCircle className="size-6" aria-hidden /> Contactar por WhatsApp
              </a>
            )}
            {mailHref && (
              <a href={mailHref} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-sand-dark bg-surface px-6 text-lg font-medium hover:bg-sand/60">
                <Mail className="size-5" aria-hidden /> Enviar por mail
              </a>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-muted">Si preferís, esperá: ya recibimos tu pedido y te vamos a escribir.</p>
        </div>
      )}

      {!agreed && !paid && order.status === "PENDIENTE_PAGO" && (
        <p className="mt-8 rounded-2xl bg-warn-soft px-5 py-4 text-center text-[15px] text-warn">
          Todavía no recibimos la confirmación del pago. Si ya pagaste, en unos minutos se actualiza solo. Si no, tenés 24 horas para completarlo; después el pedido se cancela y el stock vuelve a la tienda.
        </p>
      )}

      <div className="mt-8 rounded-2xl border border-sand-dark/70 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans text-lg font-semibold">Resumen</h2>
          <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold">{ORDER_STATUS_LABELS[order.status]}</span>
        </div>
        <ul className="divide-y divide-sand">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2.5 text-[15px]">
              <span>
                {i.quantity} × {i.productName} <span className="text-ink-muted">({i.variantLabel})</span>
              </span>
              <span className="shrink-0 font-medium">{formatMoney(Number(i.lineTotal))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1 border-t border-sand pt-3 text-[15px]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(Number(order.subtotal))}</dd></div>
          {Number(order.discount) > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Descuento</dt><dd>-{formatMoney(Number(order.discount))}</dd></div>}
          <div className="flex justify-between"><dt className="text-ink-soft">Envío</dt><dd>{order.shippingCost === null ? "A coordinar" : formatMoney(Number(order.shippingCost))}</dd></div>
          <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
        </dl>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {/* El bloque "Ahora coordinamos juntas" ya trae su botón de WhatsApp; acá va para el resto de los estados. */}
        {waNumber && !(agreed && !paid) && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`¡Hola! Soy ${order.contactName}. Te escribo por mi pedido ${num} (${ORDER_STATUS_LABELS[order.status].toLowerCase()}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-medium text-white shadow-sm hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="size-5" aria-hidden /> Consultar por WhatsApp
          </a>
        )}
        <LinkButton href="/tienda" variant="secondary">Seguir comprando</LinkButton>
        {order.userId && <LinkButton href={`/cuenta/pedidos/${order.id}`} variant="ghost">Ver en mi cuenta</LinkButton>}
      </div>
      {!order.userId && (
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/registro" className="text-brand-700 underline-offset-4 hover:underline">Creá tu cuenta</Link> para seguir tus próximos pedidos desde un solo lugar.
        </p>
      )}
    </div>
  );
}
