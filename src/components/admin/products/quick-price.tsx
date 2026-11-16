"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { quickUpdatePrice } from "@/server/actions/admin/products";

export function QuickPrice({ productId, price, disabled }: { productId: string; price: number; disabled?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(price));
  const [shown, setShown] = useState(price);
  const [pending, start] = useTransition();

  const save = () => {
    const n = Number(value.replace(",", "."));
    if (!n || n <= 0 || Number.isNaN(n)) {
      toast.error("Escribí un precio mayor a 0.");
      return;
    }
    const previous = shown;
    setShown(n); // optimista
    setEditing(false);
    start(async () => {
      const res = await quickUpdatePrice({ productId, price: n });
      if (!res.ok) {
        setShown(previous);
        setValue(String(previous));
        toast.error(res.error);
        return;
      }
      toast.success("Precio actualizado.");
      router.refresh();
    });
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex items-center gap-1"
      >
        <span className="text-ink-muted">$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ""))}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="h-10 w-24 rounded-lg border border-brand-400 px-2 text-base"
          aria-label="Nuevo precio"
        />
        <button type="submit" className="flex size-10 items-center justify-center rounded-lg bg-brand-600 text-white" aria-label="Guardar precio">
          <Check className="size-4" />
        </button>
        <button type="button" onClick={() => setEditing(false)} className="flex size-10 items-center justify-center rounded-lg text-ink-muted hover:bg-sand" aria-label="Cancelar">
          <X className="size-4" />
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        setValue(String(shown));
        setEditing(true);
      }}
      className="group inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 -ml-2 font-semibold text-ink hover:bg-sand/70 disabled:opacity-60"
      title="Tocá para cambiar el precio"
    >
      {formatMoney(shown)}
      <Pencil className="size-3.5 text-ink-muted opacity-70 group-hover:opacity-100" aria-hidden />
      <span className="sr-only">Cambiar precio</span>
    </button>
  );
}
