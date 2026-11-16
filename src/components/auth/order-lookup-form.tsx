"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ChevronRight, Package } from "lucide-react";
import { lookupOrders, type OrderLookupState } from "@/server/actions/order-lookup";
import { ORDER_STATUS_LABELS } from "@/lib/labels";
import { formatMoney, orderNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

export function OrderLookupForm() {
  const [state, action, pending] = useActionState<OrderLookupState, FormData>(lookupOrders, {});

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-5" noValidate>
        <Field label="Mail que usaste al comprar" htmlFor="lookup-email" error={state.fieldErrors?.email}>
          <Input
            id="lookup-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nombre@ejemplo.com"
            defaultValue={state.values?.email}
            required
            error={Boolean(state.fieldErrors?.email)}
          />
        </Field>
        <Field label="Teléfono que dejaste en el pedido" htmlFor="lookup-phone" help="Lo pedimos para que nadie más pueda ver tus pedidos." error={state.fieldErrors?.phone}>
          <Input
            id="lookup-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="341 555 1234"
            defaultValue={state.values?.phone}
            required
            error={Boolean(state.fieldErrors?.phone)}
          />
        </Field>
        {state.error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Buscar mis pedidos
        </Button>
      </form>

      {state.orders && (
        <section aria-label="Tus pedidos" className="flex flex-col gap-3 border-t border-sand pt-5">
          <h2 className="font-sans text-lg font-semibold">
            {state.orders.length === 1 ? "Encontramos 1 pedido" : `Encontramos ${state.orders.length} pedidos`}
          </h2>
          <ul className="flex flex-col gap-2">
            {state.orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/checkout/confirmacion/${o.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-sand-dark/70 bg-surface p-4 transition-colors hover:border-brand-400"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Package className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">Pedido {orderNumber(o.number)}</span>
                    <span className="block text-sm text-ink-muted">
                      {dateFmt.format(new Date(o.createdAt))} · {o.itemCount} {o.itemCount === 1 ? "prenda" : "prendas"} · {formatMoney(o.total)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-xs font-semibold">
                    {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
