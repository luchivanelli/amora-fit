"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Minus, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { quickUpdateStock } from "@/server/actions/admin/products";

type Variant = { id: string; size: string; color: string; stock: number };

export function QuickStock({ productId, variants, disabled }: { productId: string; variants: Variant[]; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [shownTotal, setShownTotal] = useState(variants.reduce((a, v) => a + v.stock, 0));
  const [pending, start] = useTransition();

  const openDialog = () => {
    setDraft(Object.fromEntries(variants.map((v) => [v.id, v.stock])));
    setOpen(true);
  };

  const set = (id: string, n: number) => setDraft((d) => ({ ...d, [id]: Math.max(0, Math.min(100000, Math.round(n) || 0)) }));

  const save = () => {
    const stocks = variants.map((v) => ({ variantId: v.id, stock: draft[v.id] ?? v.stock }));
    const previous = shownTotal;
    setShownTotal(stocks.reduce((a, s) => a + s.stock, 0)); // optimista
    setOpen(false);
    start(async () => {
      const res = await quickUpdateStock({ productId, stocks });
      if (!res.ok) {
        setShownTotal(previous);
        toast.error(res.error);
        return;
      }
      toast.success("Stock actualizado.");
      router.refresh();
    });
  };

  if (variants.length === 0) {
    return <span className="text-ink-muted">Sin talles</span>;
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={openDialog}
        className="group -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 hover:bg-sand/70 disabled:opacity-60"
        title="Tocá para cambiar el stock"
      >
        <span className={shownTotal === 0 ? "font-semibold text-warn" : "font-semibold"}>{shownTotal}</span>
        <span className="text-sm text-ink-muted">{shownTotal === 1 ? "unidad" : "unidades"}</span>
        <Pencil className="size-3.5 text-ink-muted opacity-70 group-hover:opacity-100" aria-hidden />
        <span className="sr-only">Cambiar stock</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Stock disponible" description="Cantidad por talle y color.">
        <ul className="flex flex-col divide-y divide-sand">
          {variants.map((v) => {
            const n = draft[v.id] ?? v.stock;
            return (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-medium">
                  {v.size} <span className="text-ink-muted">·</span> {v.color}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => set(v.id, n - 1)} className="flex size-11 items-center justify-center rounded-xl border border-sand-dark hover:bg-sand" aria-label={`Restar una unidad a ${v.size} ${v.color}`}>
                    <Minus className="size-4" />
                  </button>
                  <input
                    inputMode="numeric"
                    value={n}
                    onChange={(e) => set(v.id, Number(e.target.value.replace(/\D/g, "")))}
                    className="h-11 w-16 rounded-xl border border-sand-dark text-center text-base font-semibold"
                    aria-label={`Stock de ${v.size} ${v.color}`}
                  />
                  <button type="button" onClick={() => set(v.id, n + 1)} className="flex size-11 items-center justify-center rounded-xl border border-sand-dark hover:bg-sand" aria-label={`Sumar una unidad a ${v.size} ${v.color}`}>
                    <Plus className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Guardar stock</Button>
        </div>
      </Dialog>
    </>
  );
}
