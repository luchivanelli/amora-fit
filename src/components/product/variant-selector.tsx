"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { cn, formatMoney } from "@/lib/utils";
import { MAX_QTY_PER_LINE } from "@/lib/cart-cookie";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";
import { Swatch } from "@/components/ui/swatch";
import { useSelectedColor } from "@/components/product/color-context";

/** "queda 1 unidad" / "quedan 3 unidades" (con `solo`: "queda solo 1 unidad"). */
function unitsLeft(n: number, solo = false) {
  return `${n === 1 ? "queda" : "quedan"}${solo ? " solo" : ""} ${n} ${n === 1 ? "unidad" : "unidades"}`;
}
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Variant = { id: string; size: string; color: string; colorHex: string | null; stock: number; price: number };

export function VariantSelector({ variants, basePrice }: { variants: Variant[]; basePrice: number }) {
  const { add } = useCart();
  const [size, setSize] = useState<string | null>(null);
  // El color vive en un contexto compartido: la galería muestra las fotos de ese color.
  const { color, setColor } = useSelectedColor();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [touched, setTouched] = useState(false);

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const colors = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const v of variants) if (!m.has(v.color)) m.set(v.color, v.colorHex);
    return Array.from(m, ([name, hex]) => ({ name, hex }));
  }, [variants]);

  const stockFor = (s: string | null, c: string | null) =>
    variants.filter((v) => (s ? v.size === s : true) && (c ? v.color === c : true)).reduce((a, v) => a + v.stock, 0);

  const selected = size && color ? variants.find((v) => v.size === size && v.color === color) : undefined;
  const maxQty = selected ? Math.min(selected.stock, MAX_QTY_PER_LINE) : MAX_QTY_PER_LINE;
  const price = selected?.price ?? basePrice;
  const allOut = variants.every((v) => v.stock === 0);
  const colorLeft = color ? stockFor(size, color) : 0;

  const onAdd = async () => {
    setTouched(true);
    if (!selected) return;
    setAdding(true);
    await add(selected.id, qty);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 flex w-full items-center justify-between text-[15px] font-medium">
          <span>
            Talle {size && <span className="text-ink-muted">· {size}</span>}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const available = stockFor(s, color) > 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                aria-label={`Talle ${s}${available ? "" : ", sin stock"}`}
                className={cn(
                  "min-h-12 min-w-12 rounded-full border px-4 text-[15px] font-medium transition-colors",
                  size === s ? "border-ink bg-ink text-white" : "border-sand-dark bg-surface hover:border-ink",
                  !available && "text-ink-muted line-through opacity-60",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
        {touched && !size && (
          <p className="mt-2 text-sm text-danger" role="alert">
            Elegí un talle
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[15px] font-medium">
          Color {color && <span className="text-ink-muted">· {color}</span>}
        </legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => {
            const left = stockFor(size, c.name);
            const available = left > 0;
            const few = available && left <= LOW_STOCK_THRESHOLD;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-pressed={color === c.name}
                aria-label={`Color ${c.name}${available ? (few ? `, ${unitsLeft(left)}` : "") : ", sin stock"}`}
                title={few ? `${c.name} · ¡${unitsLeft(left)}!` : c.name}
                className={cn(
                  "relative flex size-12 items-center justify-center rounded-full border-2 transition",
                  color === c.name ? "border-ink" : "border-transparent hover:border-sand-dark",
                  !available && "opacity-40",
                )}
              >
                <Swatch hex={c.hex} className="size-8" />
                {!available && <span className="absolute h-px w-9 rotate-45 bg-ink" aria-hidden />}
                {few && <span className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-surface bg-warn" aria-hidden />}
              </button>
            );
          })}
        </div>
        {touched && !color && (
          <p className="mt-2 text-sm text-danger" role="alert">
            Elegí un color
          </p>
        )}
      </fieldset>

      {selected && selected.stock > 0 && selected.stock <= LOW_STOCK_THRESHOLD && (
        <p className="text-sm font-medium text-warn">
          ¡{capitalize(unitsLeft(selected.stock, true))} en talle {selected.size}, color {selected.color}!
        </p>
      )}
      {!selected && color && colorLeft > 0 && colorLeft <= LOW_STOCK_THRESHOLD && (
        <p className="text-sm font-medium text-warn">
          ¡{capitalize(unitsLeft(colorLeft, true))} en {color}!
        </p>
      )}
      {selected && selected.stock === 0 && <p className="text-sm font-medium text-ink-soft">Esa combinación está agotada por ahora. Probá otro talle o color.</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex h-14 items-center justify-between rounded-xl border border-sand-dark px-2 sm:w-36">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex size-10 items-center justify-center rounded-lg hover:bg-sand disabled:opacity-40" aria-label="Restar uno">
            <Minus className="size-4" />
          </button>
          <span className="text-[15px] font-semibold" aria-live="polite">
            {qty}
          </span>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="flex size-10 items-center justify-center rounded-lg hover:bg-sand disabled:opacity-40" aria-label="Sumar uno">
            <Plus className="size-4" />
          </button>
        </div>
        {/* Solo flex-1 en fila: en columna (mobile) flex-basis 0 pisa el h-14 y el botón queda aplastado. */}
        <Button size="lg" className="w-full shrink-0 sm:w-auto sm:flex-1" onClick={onAdd} loading={adding} disabled={allOut || (selected ? selected.stock === 0 : false)}>
          <ShoppingBag className="size-5" aria-hidden />
          {allOut ? "Sin stock" : `Agregar al carrito · ${formatMoney(price * qty)}`}
        </Button>
      </div>
    </div>
  );
}
