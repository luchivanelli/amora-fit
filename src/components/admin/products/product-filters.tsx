"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import type { CategoryOption } from "@/server/queries/admin/categories";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos los estados" },
  { value: "publicado", label: "Publicados" },
  { value: "borrador", label: "Borradores" },
  { value: "sin-stock", label: "Sin stock" },
  { value: "poco-stock", label: "Poco stock" },
  { value: "destacados", label: "Destacados" },
  { value: "archivados", label: "Eliminados" },
];

export function ProductFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "todos") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q });
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const roots = Array.from(new Set(categories.map((c) => c.group)));

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted" aria-hidden />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar productos por nombre"
          className="pl-12 pr-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted hover:text-ink"
            aria-label="Borrar búsqueda"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2">
        <Select
          aria-label="Filtrar por categoría"
          value={params.get("categoria") ?? ""}
          onChange={(e) => update({ categoria: e.target.value || null })}
        >
          <option value="">Todas las categorías</option>
          {roots.map((root) => (
            <optgroup key={root} label={root}>
              {categories
                .filter((c) => c.group === root)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.isRoot ? c.label : `${c.label}`}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por estado"
          value={params.get("estado") ?? "todos"}
          onChange={(e) => update({ estado: e.target.value })}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
