"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ShopCategory } from "@/server/queries/shop/categories";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Swatch } from "@/components/ui/swatch";

export type Facets = { sizes: string[]; colors: { name: string; hex: string | null }[]; minPrice: number; maxPrice: number };
type Props = { categories: ShopCategory[]; facets: Facets; total: number };

const FILTER_KEYS = ["categoria", "sub", "talle", "color", "min", "max", "q"];

/** Lee y escribe los filtros en la URL (searchParams), así son compartibles y SSR. */
function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const get = (k: string) => params.get(k) ?? "";
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const activeCount = FILTER_KEYS.filter((k) => get(k)).length;
  return { get, set, activeCount, pending };
}

const legendCls = "mb-3 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink";

function FiltersPanel({ categories, facets }: Omit<Props, "total">) {
  const { get, set, activeCount } = useCatalogParams();

  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className={legendCls}>Categoría</legend>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button type="button" onClick={() => set({ categoria: null, sub: null })} className={cn("flex min-h-10 w-full items-center rounded-xl px-3 text-left text-[15px] transition-colors", !get("categoria") ? "bg-brand-100 font-semibold text-brand-800" : "text-ink-soft hover:bg-sand hover:text-ink")}>
              Todo
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => set({ categoria: c.slug, sub: null })} className={cn("flex min-h-10 w-full items-center rounded-xl px-3 text-left text-[15px] transition-colors", get("categoria") === c.slug && !get("sub") ? "bg-brand-100 font-semibold text-brand-800" : "text-ink-soft hover:bg-sand hover:text-ink")}>
                {c.name}
              </button>
              {get("categoria") === c.slug && c.children.length > 0 && (
                <ul className="ml-4 mt-1 flex flex-col border-l-2 border-brand-200 pl-2">
                  {c.children.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => set({ categoria: c.slug, sub: s.slug })} className={cn("flex min-h-9 w-full items-center rounded-xl px-3 text-left text-[15px] transition-colors", get("sub") === s.slug ? "bg-brand-100 font-semibold text-brand-800" : "text-ink-soft hover:bg-sand hover:text-ink")}>
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </fieldset>

      {facets.sizes.length > 0 && (
        <fieldset>
          <legend className={legendCls}>Talle</legend>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => {
              const active = get("talle").toUpperCase() === s.toUpperCase();
              return (
                <button key={s} type="button" aria-pressed={active} onClick={() => set({ talle: active ? null : s })} className={cn("min-h-10 min-w-10 rounded-full border px-3 text-[15px] font-medium transition-all", active ? "border-brand-600 bg-brand-600 text-white shadow-sm" : "border-sand-dark bg-surface hover:border-brand-400 hover:bg-brand-50")}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {facets.colors.length > 0 && (
        <fieldset>
          <legend className={legendCls}>Color</legend>
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((c) => {
              const active = get("color").toLowerCase() === c.name.toLowerCase();
              return (
                <button key={c.name} type="button" aria-pressed={active} onClick={() => set({ color: active ? null : c.name })} className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-[15px] transition-all", active ? "border-brand-600 bg-brand-50 font-medium" : "border-sand-dark bg-surface hover:border-brand-400")}>
                  <Swatch hex={c.hex} className="size-4" />
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legendCls}>Precio</legend>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            set({ min: String(f.get("min") || ""), max: String(f.get("max") || "") });
          }}
          className="flex items-center gap-2"
        >
          <input name="min" inputMode="numeric" defaultValue={get("min")} placeholder={`${facets.minPrice}`} aria-label="Precio mínimo" className="h-11 w-full min-w-0 rounded-full border border-sand-dark bg-surface px-4 text-[15px] focus:border-brand-500 focus:outline-none" />
          <span className="text-ink-muted">–</span>
          <input name="max" inputMode="numeric" defaultValue={get("max")} placeholder={`${facets.maxPrice}`} aria-label="Precio máximo" className="h-11 w-full min-w-0 rounded-full border border-sand-dark bg-surface px-4 text-[15px] focus:border-brand-500 focus:outline-none" />
          <Button type="submit" size="sm" variant="secondary">
            Ir
          </Button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          Entre {formatMoney(facets.minPrice)} y {formatMoney(facets.maxPrice)}
        </p>
      </fieldset>

      {activeCount > 0 && (
        <Button variant="ghost" onClick={() => set({ categoria: null, sub: null, talle: null, color: null, min: null, max: null, q: null })}>
          <X className="size-4" aria-hidden /> Limpiar filtros
        </Button>
      )}
    </div>
  );
}

/** Barra superior: cantidad, búsqueda activa, orden y (en celular) botón que abre los filtros. */
export function CatalogToolbar({ categories, facets, total }: Props) {
  const { get, set, activeCount, pending } = useCatalogParams();
  const [open, setOpen] = useState(false);
  const q = get("q");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-[15px] text-ink-soft transition-opacity", pending && "opacity-50")} aria-live="polite">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
          {q && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 py-1 pl-3 pr-1 text-sm font-medium text-brand-800">
              <Search className="size-3.5" aria-hidden /> “{q}”
              <button type="button" onClick={() => set({ q: null })} className="flex size-6 items-center justify-center rounded-full hover:bg-brand-200" aria-label="Quitar búsqueda">
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> Filtros
            {activeCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{activeCount}</span>}
          </Button>
          <Select aria-label="Ordenar" value={get("orden") || "novedades"} onChange={(e) => set({ orden: e.target.value === "novedades" ? null : e.target.value })} className="h-10 w-auto min-w-44 rounded-full text-[15px]">
            <option value="novedades">Novedades</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
          </Select>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] animate-fade-up overflow-y-auto rounded-t-4xl bg-cream p-5 safe-bottom">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-sand-dark" aria-hidden />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-semibold">Filtros</h2>
              <button type="button" onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-sand" aria-label="Cerrar filtros">
                <X className="size-5" />
              </button>
            </div>
            <FiltersPanel categories={categories} facets={facets} />
            <Button fullWidth className="mt-6" onClick={() => setOpen(false)}>
              Ver {total} {total === 1 ? "producto" : "productos"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/** Columna lateral de filtros (solo escritorio). */
export function CatalogSidebar({ categories, facets }: Omit<Props, "total">) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 rounded-3xl border border-sand-dark/60 bg-surface p-5">
        <FiltersPanel categories={categories} facets={facets} />
      </div>
    </aside>
  );
}
