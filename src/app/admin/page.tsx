import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Package, AlertTriangle, TrendingUp, Plus, Shirt } from "lucide-react";
import { formatLowStock } from "@/lib/stock";
import { getDashboardData } from "@/server/queries/admin/dashboard";
import { StatCard, StatRow } from "@/components/admin/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { formatDate, formatMoney, orderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Inicio" };

export default async function AdminHomePage() {
  const data = await getDashboardData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buen día" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-medium sm:text-4xl">{greeting} ✨</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Así está tu tienda hoy.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Package}
          label="Pedidos nuevos"
          value={String(data.newOrders.total)}
          href="/admin/pedidos?estado=nuevos"
          tone={data.newOrders.total > 0 ? "brand" : "neutral"}
        >
          {data.newOrders.total === 0 ? (
            <p className="py-0.5">Todo al día. No hay pedidos esperando.</p>
          ) : (
            <>
              <StatRow label="A acordar con la clienta" value={data.newOrders.toAgree} highlight={data.newOrders.toAgree > 0} />
              {data.newOrders.awaitingPayment > 0 && <StatRow label="Esperando pago" value={data.newOrders.awaitingPayment} />}
              <StatRow label="Pagados, para preparar" value={data.newOrders.paid} highlight={data.newOrders.paid > 0} />
            </>
          )}
        </StatCard>
        <StatCard
          icon={AlertTriangle}
          label="Poco stock"
          value={String(data.lowStockSummary.products)}
          href="/admin/productos?estado=poco-stock"
          tone={data.lowStockSummary.products > 0 ? "warning" : "neutral"}
        >
          {data.lowStockSummary.products === 0 ? (
            <p className="py-0.5">Todos los talles y colores tienen stock.</p>
          ) : (
            <>
              <StatRow label="Talles agotados" value={data.lowStockSummary.soldOutCombos} highlight={data.lowStockSummary.soldOutCombos > 0} />
              <StatRow label="Queda 1 sola" value={data.lowStockSummary.lastUnitCombos} />
            </>
          )}
        </StatCard>
        <StatCard
          icon={TrendingUp}
          label="Ventas del mes"
          value={formatMoney(data.monthSalesTotal)}
          badge={
            data.monthChangePct === null
              ? undefined
              : {
                  text: `${data.monthChangePct > 0 ? "+" : ""}${data.monthChangePct}%`,
                  tone: data.monthChangePct > 0 ? "up" : data.monthChangePct < 0 ? "down" : "flat",
                }
          }
          href="/admin/pedidos"
          tone="neutral"
        >
          <StatRow label={data.monthSalesCount === 1 ? "Pedido pagado" : "Pedidos pagados"} value={data.monthSalesCount} highlight />
          <StatRow label="Ticket promedio" value={data.monthSalesCount > 0 ? formatMoney(data.monthAvgTicket) : "—"} />
          {data.monthChangePct !== null && <p className="pt-1 text-xs text-ink-muted">Comparado con el mismo período del mes pasado.</p>}
        </StatCard>
        <Link
          href="/admin/productos/nuevo"
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-2xl bg-brand-600 p-5 text-center text-white shadow-sm transition-colors hover:bg-brand-hover"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
            <Plus className="size-7" aria-hidden />
          </span>
          <span className="text-lg font-semibold">Agregar producto</span>
          <span className="text-sm text-white/80">
            {data.productCount} {data.productCount === 1 ? "producto cargado" : "productos cargados"}
            {data.draftCount > 0 && ` · ${data.draftCount} en borrador`}
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-semibold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-[15px] text-brand-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-[15px] text-ink-muted">Todavía no hay pedidos. Cuando alguien compre, aparece acá.</p>
          ) : (
            <ul className="divide-y divide-sand">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-sand/50">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.contactName}</p>
                      <p className="text-sm text-ink-muted">
                        {orderNumber(o.number)} · {formatDate(o.createdAt)} · {PAYMENT_METHOD_LABELS[o.paymentMethod]}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold">{formatMoney(o.total)}</span>
                      <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-lg font-semibold">Poco stock</h2>
            <Link href="/admin/productos?estado=poco-stock" className="text-[15px] text-brand-700 hover:underline">
              Ver todos
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-[15px] text-ink-muted">Todos tus productos publicados tienen stock. ¡Genial!</p>
          ) : (
            <ul className="divide-y divide-sand">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/productos/${p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-sand/50">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <Shirt className="absolute inset-0 m-auto size-5 text-ink-muted" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-sm text-ink-muted">
                        {p.colors.map(formatLowStock).join(" / ")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
