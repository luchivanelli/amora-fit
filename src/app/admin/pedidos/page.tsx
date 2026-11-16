import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { listOrders } from "@/server/queries/admin/orders";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { StatusSelect } from "@/components/admin/orders/status-select";
import { PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { formatDate, formatMoney, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos" };

type Props = { searchParams: Promise<{ estado?: string; metodo?: string; page?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const result = await listOrders({ estado: params.estado, metodo: params.metodo, page });
  const hasFilters = Boolean((params.estado && params.estado !== "todos") || params.metodo);

  const nextParams = new URLSearchParams();
  if (params.estado) nextParams.set("estado", params.estado);
  if (params.metodo) nextParams.set("metodo", params.metodo);
  nextParams.set("page", String(page + 1));

  return (
    <div>
      <PageHeader title="Pedidos" subtitle={result.total ? `${result.total} ${result.total === 1 ? "pedido" : "pedidos"}` : undefined} />
      <OrderFilters />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<Package className="size-7" />}
          title={hasFilters ? "No hay pedidos con esos filtros" : "Todavía no hay pedidos"}
          description={hasFilters ? "Probá con otro estado o método de pago." : "Cuando alguien compre en la tienda, el pedido aparece acá."}
          action={hasFilters ? <LinkButton href="/admin/pedidos" variant="secondary">Ver todos</LinkButton> : undefined}
        />
      ) : (
        <>
          {/* Celular */}
          <ul className="flex flex-col gap-3 md:hidden">
            {result.items.map((o) => (
              <li key={o.id} className="rounded-2xl border border-sand-dark/70 bg-surface p-4">
                <Link href={`/admin/pedidos/${o.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{o.contactName}</p>
                      <p className="text-sm text-ink-muted">
                        {orderNumber(o.number)} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatMoney(o.total)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={o.paymentMethod === "MERCADO_PAGO" ? "info" : "neutral"} dot={false}>
                      {PAYMENT_METHOD_LABELS[o.paymentMethod]}
                    </Badge>
                    <span className="text-sm text-ink-muted">
                      {o.itemCount} {o.itemCount === 1 ? "producto" : "productos"}
                    </span>
                  </div>
                </Link>
                <div className="mt-3">
                  <StatusSelect orderId={o.id} status={o.status} />
                </div>
              </li>
            ))}
          </ul>

          {/* Escritorio */}
          <div className="hidden overflow-hidden rounded-2xl border border-sand-dark/70 bg-surface md:block">
            <table className="w-full table-fixed text-[15px]">
              <colgroup>
                <col className="w-[18%]" />
                <col />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-60" />
              </colgroup>
              <thead className="bg-sand/50 text-left text-sm text-ink-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((o) => (
                  <tr key={o.id} className="border-b border-sand last:border-b-0">
                    <td className="px-4 py-3 align-middle">
                      <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                        {orderNumber(o.number)}
                      </Link>
                      <p className="text-sm text-ink-muted">{formatDate(o.createdAt, true)}</p>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Link href={`/admin/pedidos/${o.id}`} className="block truncate font-medium hover:underline">
                        {o.contactName}
                      </Link>
                      <p className="text-sm text-ink-muted">
                        {o.itemCount} {o.itemCount === 1 ? "producto" : "productos"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge tone={o.paymentMethod === "MERCADO_PAGO" ? "info" : "neutral"} dot={false}>
                        {PAYMENT_METHOD_LABELS[o.paymentMethod]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right align-middle font-semibold">{formatMoney(o.total)}</td>
                    <td className="px-4 py-3 align-middle">
                      <StatusSelect orderId={o.id} status={o.status} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.hasMore && (
            <div className="mt-6 flex justify-center">
              <LinkButton href={`/admin/pedidos?${nextParams.toString()}`} variant="secondary">
                Ver más pedidos
              </LinkButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
