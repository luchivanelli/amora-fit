"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ColorDialog } from "@/components/admin/products/form/color-dialog";
import { DEFAULT_NUMERIC_SIZES, DEFAULT_SIZES } from "@/lib/labels";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/utils";

type Color = { name: string; hex?: string | null };

type Props = {
  sizes: string[];
  colors: Color[];
  stock: Record<string, number>;
  errors?: { sizes?: string; colors?: string; stock?: string };
  onChange: (patch: { sizes?: string[]; colors?: Color[]; stock?: Record<string, number> }) => void;
};

export const stockKey = (size: string, color: string) => `${size}::${color}`;

export function VariantsBuilder({ sizes, colors, stock, errors, onChange }: Props) {
  const [customSize, setCustomSize] = useState("");
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [colorDialog, setColorDialog] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ kind: "size" | "color"; value: string; units: number } | null>(null);
  const [fillAll, setFillAll] = useState("");

  const customSizes = sizes.filter((s) => !DEFAULT_SIZES.includes(s) && !DEFAULT_NUMERIC_SIZES.includes(s));

  const unitsFor = (kind: "size" | "color", value: string) =>
    Object.entries(stock).reduce((acc, [k, n]) => {
      const [s, c] = k.split("::");
      return acc + ((kind === "size" ? s : c) === value ? n : 0);
    }, 0);

  const removeSize = (size: string) => {
    const nextStock = Object.fromEntries(Object.entries(stock).filter(([k]) => !k.startsWith(`${size}::`)));
    onChange({ sizes: sizes.filter((s) => s !== size), stock: nextStock });
  };

  const removeColor = (name: string) => {
    const nextStock = Object.fromEntries(Object.entries(stock).filter(([k]) => !k.endsWith(`::${name}`)));
    onChange({ colors: colors.filter((c) => c.name !== name), stock: nextStock });
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      const units = unitsFor("size", size);
      if (units > 0) return setPendingRemoval({ kind: "size", value: size, units });
      removeSize(size);
    } else {
      onChange({ sizes: [...sizes, size] });
    }
  };

  /** Quita un color ya elegido (pide confirmación si tiene stock cargado). */
  const toggleColor = (name: string) => {
    const units = unitsFor("color", name);
    if (units > 0) return setPendingRemoval({ kind: "color", value: name, units });
    removeColor(name);
  };

  const addCustomSize = () => {
    const clean = customSize.trim().toUpperCase().slice(0, 12);
    if (!clean) return;
    if (!sizes.includes(clean)) onChange({ sizes: [...sizes, clean] });
    setCustomSize("");
    setShowCustomSize(false);
  };

  const setCell = (size: string, color: string, raw: string) => {
    const n = Math.max(0, Math.min(100000, Number(raw.replace(/\D/g, "")) || 0));
    onChange({ stock: { ...stock, [stockKey(size, color)]: n } });
  };

  const applyFillAll = () => {
    const n = Math.max(0, Math.min(100000, Number(fillAll.replace(/\D/g, "")) || 0));
    const next: Record<string, number> = {};
    for (const s of sizes) for (const c of colors) next[stockKey(s, c.name)] = n;
    onChange({ stock: next });
    setFillAll("");
  };

  const totalUnits = sizes.reduce((acc, s) => acc + colors.reduce((a, c) => a + (stock[stockKey(s, c.name)] ?? 0), 0), 0);

  return (
    <div className="flex flex-col gap-7">
      {/* Talles */}
      <div>
        <p className="mb-1 text-[15px] font-medium">Talles</p>
        <p className="mb-3 text-sm text-ink-muted">Tocá los que tenga este producto.</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SIZES.map((s) => (
            <Chip key={s} selected={sizes.includes(s)} onClick={() => toggleSize(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_NUMERIC_SIZES.map((s) => (
            <Chip key={s} selected={sizes.includes(s)} onClick={() => toggleSize(s)}>
              {s}
            </Chip>
          ))}
          {customSizes.map((s) => (
            <Chip key={s} selected onClick={() => toggleSize(s)}>
              {s}
            </Chip>
          ))}
          {showCustomSize ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCustomSize();
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onBlur={() => !customSize && setShowCustomSize(false)}
                placeholder="Ej: 38"
                maxLength={12}
                className="h-11 w-24 rounded-full border border-brand-400 px-4 text-[15px]"
                aria-label="Nuevo talle"
              />
              <Button type="submit" size="sm">
                Agregar
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomSize(true)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-sand-dark px-4 text-[15px] font-medium text-ink-soft hover:border-brand-400 hover:text-brand-700"
            >
              <Plus className="size-4" aria-hidden /> Otro talle
            </button>
          )}
        </div>
        {errors?.sizes && (
          <p className="mt-2 text-sm text-danger" role="alert">
            {errors.sizes}
          </p>
        )}
      </div>

      {/* Colores */}
      <div>
        <p className="mb-1 text-[15px] font-medium">Colores</p>
        <p className="mb-3 text-sm text-ink-muted">
          Cada color es una columna de stock. Si una prenda combina tonos (por ejemplo, Blanco y Negro), cargala como un solo color. Tocá uno para quitarlo.
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <Chip key={c.name} selected swatch={c.hex ?? "#ddd"} onClick={() => toggleColor(c.name)} aria-label={`Quitar color ${c.name}`}>
              {c.name}
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => setColorDialog(true)}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-sand-dark px-4 text-[15px] font-medium text-ink-soft hover:border-brand-400 hover:text-brand-700"
          >
            <Plus className="size-4" aria-hidden /> Agregar color
          </button>
        </div>
        {errors?.colors && (
          <p className="mt-2 text-sm text-danger" role="alert">
            {errors.colors}
          </p>
        )}
      </div>

      {/* Grilla de stock */}
      {sizes.length > 0 && colors.length > 0 && (
        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[15px] font-medium">Cantidad disponible</p>
              <p className="text-sm text-ink-muted">
                Completá cuántas unidades tenés de cada combinación. Total: <strong className="text-ink">{totalUnits}</strong>
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFillAll();
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="fill-all" className="text-sm text-ink-soft">
                Mismo stock para todos:
              </label>
              <input
                id="fill-all"
                inputMode="numeric"
                value={fillAll}
                onChange={(e) => setFillAll(e.target.value.replace(/\D/g, ""))}
                className="h-10 w-16 rounded-lg border border-sand-dark text-center"
                placeholder="0"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={fillAll === ""}>
                Aplicar
              </Button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border border-sand-dark/70">
            <table className="w-full min-w-[320px] text-[15px]">
              <thead className="bg-sand/50">
                <tr>
                  <th scope="col" className="sticky left-0 bg-sand/50 px-3 py-2 text-left text-sm font-medium text-ink-soft backdrop-blur">
                    Talle
                  </th>
                  {colors.map((c) => (
                    <th scope="col" key={c.name} className="px-2 py-2 text-center text-sm font-medium text-ink-soft">
                      <span className="inline-flex items-center gap-1.5">
                        <Swatch hex={c.hex} className="size-3" />
                        {c.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((s) => (
                  <tr key={s} className="border-t border-sand">
                    <th scope="row" className="sticky left-0 bg-surface px-3 py-2 text-left font-semibold">
                      {s}
                    </th>
                    {colors.map((c) => {
                      const v = stock[stockKey(s, c.name)] ?? 0;
                      return (
                        <td key={c.name} className="px-2 py-2 text-center">
                          <input
                            inputMode="numeric"
                            value={v}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setCell(s, c.name, e.target.value)}
                            className={cn(
                              "h-11 w-16 rounded-lg border text-center font-medium",
                              v === 0 ? "border-sand-dark text-ink-muted" : "border-brand-300 bg-brand-50 text-ink",
                            )}
                            aria-label={`Stock talle ${s} color ${c.name}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ColorDialog
        open={colorDialog}
        onClose={() => setColorDialog(false)}
        existing={colors.map((c) => c.name)}
        onAdd={(c) => onChange({ colors: [...colors, c] })}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (!pendingRemoval) return;
          if (pendingRemoval.kind === "size") removeSize(pendingRemoval.value);
          else removeColor(pendingRemoval.value);
          setPendingRemoval(null);
        }}
        title={`¿Quitar ${pendingRemoval?.kind === "size" ? "el talle" : "el color"} ${pendingRemoval?.value}?`}
        description={`Tiene ${pendingRemoval?.units} ${pendingRemoval?.units === 1 ? "unidad cargada" : "unidades cargadas"}. Si lo quitás, ese stock se pierde.`}
        confirmLabel="Sí, quitar"
        destructive
      />
    </div>
  );
}
