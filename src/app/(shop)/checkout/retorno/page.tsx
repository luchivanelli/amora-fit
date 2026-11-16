import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { orderNumber } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Volviendo de Mercado Pago", robots: { index: false } };

type Props = { searchParams: Promise<{ estado?: string; pedido?: string; status?: string; external_reference?: string }> };

/** Página a la que vuelve la clienta desde Checkout Pro. El estado real lo fija el webhook. */
export default async function ReturnPage({ searchParams }: Props) {
  const p = await searchParams;
  const orderId = p.pedido ?? p.external_reference;
  if (!orderId) redirect("/tienda");

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, number: true, status: true, contactName: true } });
  if (!order) redirect("/tienda");

  const paid = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO"].includes(order.status);
  const state = paid ? "aprobado" : (p.estado ?? p.status ?? "pendiente");

  const content =
    state === "aprobado" || state === "approved"
      ? { icon: CheckCircle2, tone: "text-brand-700 bg-brand-100", title: "¡Pago recibido!", text: paid ? "Tu pedido ya está confirmado. En breve lo preparamos." : "Mercado Pago aprobó el pago. En unos segundos se refleja en tu pedido." }
      : state === "rechazado" || state === "failure" || state === "rejected"
        ? { icon: XCircle, tone: "text-danger bg-danger-soft", title: "El pago no se pudo procesar", text: "No te preocupes, tu pedido sigue reservado por 24 horas. Podés intentar con otro medio de pago o escribirnos." }
        : { icon: Clock, tone: "text-warn bg-warn-soft", title: "Pago pendiente", text: "Mercado Pago todavía está procesando el pago (pasa con transferencias o pagos en efectivo). Te avisamos por mail cuando se acredite." };

  const Icon = content.icon;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <span className={`mx-auto flex size-16 items-center justify-center rounded-full ${content.tone}`}>
        <Icon className="size-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-4xl font-medium">{content.title}</h1>
      <p className="mt-2 text-lg text-ink-soft">{content.text}</p>
      <p className="mt-1 text-sm text-ink-muted">Pedido {orderNumber(order.number)}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <LinkButton href={`/checkout/confirmacion/${order.id}`}>Ver mi pedido</LinkButton>
        <LinkButton href="/tienda" variant="secondary">Seguir comprando</LinkButton>
      </div>
    </div>
  );
}
