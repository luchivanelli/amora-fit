import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Shirt, Mail, Phone, MapPin } from "lucide-react";
import { getOrderDetail } from "@/server/queries/admin/orders";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/admin/orders/status-select";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { formatDate, formatMoney, orderNumber } from "@/lib/utils";
import { sellerToCustomerMessage, waLink } from "@/server/services/whatsapp";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderDetail(id);
  return { title: order ? `Pedido ${orderNumber(order.number)}` : "Pedido" };
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const isAgreed = order.paymentMethod === "ACORDAR_CON_VENDEDOR";
  const whatsappHref = waLink(order.contactPhone, sellerToCustomerMessage(order));
  const address = [order.shipping.street, order.shipping.city, order.shipping.province, order.shipping.zip].filter(Boolean).join(", ");

  return (
    <div>
      <PageHeader
        title={`Pedido ${orderNumber(order.number)}`}
        subtitle={`${formatDate(order.createdAt, true)} · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`}
        backHref="/admin/pedidos"
        backLabel="Pedidos"
        action={<Badge tone={ORDER_STATUS_TONE[order.status]} className="text-sm">{ORDER_STATUS_LABELS[order.status]}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Productos</h2>
            <ul className="divide-y divide-sand">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {i.imageUrl ? <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : <Shirt className="absolute inset-0 m-auto size-5 text-ink-muted" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {i.productId ? (
                      <Link href={`/admin/productos/${i.productId}`} className="block truncate font-medium hover:underline">
                        {i.productName}
                      </Link>
                    ) : (
                      <p className="truncate font-medium">{i.productName}</p>
                    )}
                    <p className="text-sm text-ink-muted">
                      {i.variantLabel} · {i.quantity} × {formatMoney(i.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold">{formatMoney(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1.5 border-t border-sand pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd>{formatMoney(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Descuento {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd>-{formatMoney(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-soft">Envío</dt>
                <dd>{order.shippingCost === null ? <span className="text-warn">A coordinar</span> : formatMoney(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 font-sans text-lg font-semibold">Cliente</h2>
            <div className="flex flex-col gap-3 text-[15px]">
              <p className="text-lg font-medium">
                {order.contactName} {order.isGuest && <span className="text-sm font-normal text-ink-muted">(compró como invitada)</span>}
              </p>
              <a href={`tel:${order.contactPhone}`} className="flex items-center gap-2 text-ink hover:underline">
                <Phone className="size-4 text-ink-muted" aria-hidden /> {order.contactPhone}
              </a>
              <a href={`mailto:${order.contactEmail}`} className="flex items-center gap-2 text-ink hover:underline">
                <Mail className="size-4 text-ink-muted" aria-hidden /> {order.contactEmail}
              </a>
              <p className="flex items-start gap-2">
                <MapPin className="mt-1 size-4 shrink-0 text-ink-muted" aria-hidden />
                <span>{address || order.shipping.zone || <span className="text-ink-muted">Sin dirección cargada</span>}{address && order.shipping.zone && <span className="block text-sm text-ink-muted">{order.shipping.zone}</span>}</span>
              </p>
              {order.notes && (
                <div className="rounded-xl bg-sand/50 px-4 py-3">
                  <p className="text-sm font-medium text-ink-soft">Observaciones del cliente</p>
                  <p className="mt-1 whitespace-pre-line">{order.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {order.payment && (
            <Card>
              <h2 className="mb-3 font-sans text-lg font-semibold">Pago por Mercado Pago</h2>
              <dl className="grid grid-cols-2 gap-2 text-[15px]">
                <dt className="text-ink-soft">Estado</dt>
                <dd>{order.payment.status === "APPROVED" ? "Aprobado" : order.payment.status === "PENDING" || order.payment.status === "IN_PROCESS" ? "Pendiente" : order.payment.status === "REFUNDED" ? "Devuelto" : "Rechazado"}</dd>
                <dt className="text-ink-soft">Monto</dt>
                <dd>{formatMoney(order.payment.amount)}</dd>
                {order.payment.mpPaymentId && (
                  <>
                    <dt className="text-ink-soft">Nº de operación</dt>
                    <dd>{order.payment.mpPaymentId}</dd>
                  </>
                )}
              </dl>
            </Card>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-3 font-sans text-lg font-semibold">Estado del pedido</h2>
            <StatusSelect orderId={order.id} status={order.status} />
            <p className="mt-2 text-sm text-ink-muted">Cambialo a medida que avanza. Al cancelar, el stock vuelve a la tienda.</p>
          </Card>

          <OrderActions order={order} whatsappHref={whatsappHref} isAgreed={isAgreed} />
        </aside>
      </div>
    </div>
  );
}
