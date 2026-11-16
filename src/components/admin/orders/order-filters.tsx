"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/components/ui/field";
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/lib/labels";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "todos") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
      <Select aria-label="Filtrar por estado" value={params.get("estado") ?? "todos"} onChange={(e) => update("estado", e.target.value)}>
        <option value="todos">Todos los estados</option>
        <option value="nuevos">Nuevos (sin preparar)</option>
        {ORDER_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <Select aria-label="Filtrar por método de pago" value={params.get("metodo") ?? ""} onChange={(e) => update("metodo", e.target.value)}>
        <option value="">Todos los métodos de pago</option>
        <option value="MERCADO_PAGO">Mercado Pago</option>
        <option value="ACORDAR_CON_VENDEDOR">Acordar con la vendedora</option>
      </Select>
    </div>
  );
}
