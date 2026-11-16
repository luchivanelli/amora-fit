"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import type { ShopCategory } from "@/server/queries/shop/categories";
import { Sparkle } from "@/components/decor/sparkle";

/** Lupa del header: abre un buscador a pantalla completa que lleva a /tienda?q=… */
export function SearchButton({ categories }: { categories: ShopCategory[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => input.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open]);

  // Atajo: "/" abre el buscador (si no se está escribiendo en otro campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    setOpen(false);
    router.push(term ? `/tienda?q=${encodeURIComponent(term)}` : "/tienda");
  };

  const overlay = (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Buscar productos">
      <div className="absolute inset-0 bg-scrim/55 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div className="absolute inset-x-0 top-0 animate-fade-up bg-cream px-4 pb-8 pt-6 shadow-lift sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={submit} className="flex items-center gap-3">
            <label htmlFor="site-search" className="sr-only">
              ¿Qué estás buscando?
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                ref={input}
                id="site-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscá un corpiño, un calza, un conjunto…"
                autoComplete="off"
                className="h-14 w-full rounded-full border border-sand-dark bg-surface pl-13 pr-5 text-lg text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button type="submit" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-hover" aria-label="Buscar">
              <ArrowRight className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => setOpen(false)} className="flex size-14 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sand hover:text-ink" aria-label="Cerrar buscador">
              <X className="size-6" aria-hidden />
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              <Sparkle className="size-3 text-blush" /> Explorar
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/tienda" onClick={() => setOpen(false)} className="rounded-full border border-sand-dark bg-surface px-4 py-2 text-[15px] font-medium hover:border-brand-400 hover:bg-brand-50">
                Toda la tienda
              </Link>
              <Link href="/tienda?orden=novedades" onClick={() => setOpen(false)} className="rounded-full border border-sand-dark bg-surface px-4 py-2 text-[15px] font-medium hover:border-brand-400 hover:bg-brand-50">
                Nuevos ingresos
              </Link>
              {categories.flatMap((c) => [
                <Link key={c.id} href={`/tienda?categoria=${c.slug}`} onClick={() => setOpen(false)} className="rounded-full border border-sand-dark bg-surface px-4 py-2 text-[15px] font-medium hover:border-brand-400 hover:bg-brand-50">
                  {c.name}
                </Link>,
                ...c.children.map((s) => (
                  <Link key={s.id} href={`/tienda?categoria=${c.slug}&sub=${s.slug}`} onClick={() => setOpen(false)} className="rounded-full border border-sand-dark bg-surface px-4 py-2 text-[15px] text-ink-soft hover:border-brand-400 hover:bg-brand-50 hover:text-ink">
                    {s.name}
                  </Link>
                )),
              ])}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand" aria-label="Buscar productos" aria-expanded={open}>
        <Search className="size-5" aria-hidden />
      </button>
      {open && typeof document !== "undefined" && createPortal(overlay, document.body)}
    </>
  );
}
