"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { quickUpdatePrice } from "@/server/actions/admin/products";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, MoneyInput } from "@/components/ui/field";

/** Precio con edición rápida en un diálogo (igual que el stock), así entra en cualquier ancho de columna. */
export function QuickPrice({ productId, name, price, disabled }: { productId: string; name?: string; price: number; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number | null>(price);
  const [shown, setShown] = useState(price);
  const [pending, start] = useTransition();

  const save = () => {
    if (!value || value <= 0) {
      toast.error("Escribí un precio mayor a 0.");
      return;
    }
    const previous = shown;
    setShown(value); // optimista
    setOpen(false);
    start(async () => {
      const res = await quickUpdatePrice({ productId, price: value });
      if (!res.ok) {
        setShown(previous);
        toast.error(res.error);
        return;
      }
      toast.success("Precio actualizado.");
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setValue(shown);
          setOpen(true);
        }}
        className="group -ml-2 inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 font-semibold text-ink hover:bg-sand/70 disabled:opacity-60"
        title="Tocá para cambiar el precio"
      >
        {formatMoney(shown)}
        <Pencil className="size-3.5 text-ink-muted opacity-70 group-hover:opacity-100" aria-hidden />
        <span className="sr-only">Cambiar precio</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cambiar precio" description={name}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Precio" htmlFor={`price-${productId}`}>
            <MoneyInput id={`price-${productId}`} value={value} onChange={setValue} autoFocus />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar precio</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
