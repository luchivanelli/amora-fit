"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, User, ChevronRight, Sparkles } from "lucide-react";
import type { ShopCategory } from "@/server/queries/shop/categories";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Blob } from "@/components/decor/blob";

export function MobileNav({ categories, isLoggedIn }: { categories: ShopCategory[]; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const openBtn = useRef<HTMLButtonElement>(null);

  // Cerrar al navegar.
  useEffect(() => setOpen(false), [pathname]);

  // Bloquear el scroll de fondo, cerrar con Escape y manejar el foco.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      openBtn.current?.focus();
    };
  }, [open]);

  const drawer = (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-fade-up flex-col overflow-hidden rounded-r-4xl bg-cream shadow-lift">
        <Blob tone="brand" blur className="-right-20 -top-24 size-72 opacity-80" />
        <Blob tone="blush" shape={2} blur className="-bottom-24 -left-16 size-64 opacity-70" />
        <div className="relative flex items-center justify-between px-5 py-4">
          <Wordmark href={null} size="sm" />
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-sand" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 py-2">
          <Link href="/tienda" className="flex min-h-12 items-center rounded-2xl px-3 font-display text-2xl font-medium hover:bg-sand/70">
            Tienda
          </Link>
          {categories.map((c) => (
            <div key={c.id} className="mt-1">
              <Link href={`/tienda?categoria=${c.slug}`} className="flex min-h-12 items-center justify-between rounded-2xl px-3 font-display text-2xl font-medium hover:bg-sand/70">
                {c.name} <ChevronRight className="size-5 text-ink-muted" aria-hidden />
              </Link>
              {c.children.map((s) => (
                <Link key={s.id} href={`/tienda?categoria=${c.slug}&sub=${s.slug}`} className="flex min-h-11 items-center rounded-2xl px-6 text-[15px] text-ink-soft hover:bg-sand/70 hover:text-ink">
                  {s.name}
                </Link>
              ))}
            </div>
          ))}
          <Link href="/tienda?orden=novedades" className="mt-1 flex min-h-12 items-center gap-2 rounded-2xl px-3 font-display text-2xl font-medium text-blush-deep hover:bg-blush-soft">
            <Sparkles className="size-5" aria-hidden /> Novedades
          </Link>
          <div className="mt-4 border-t border-sand-dark/60 pt-4">
            {[
              ["/preguntas-frecuentes", "Preguntas frecuentes"],
              ["/cambios-y-devoluciones", "Cambios y devoluciones"],
              ["/contacto", "Contacto"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="flex min-h-11 items-center rounded-2xl px-3 text-[15px] text-ink-soft hover:bg-sand/70 hover:text-ink">
                {label}
              </Link>
            ))}
            <ThemeToggle label className="mt-1 w-full justify-start px-3 text-ink-soft" />
          </div>
        </nav>
        <div className="relative flex gap-2 border-t border-sand-dark/60 p-3 safe-bottom">
          <Link href="/cuenta/favoritos" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-[15px] font-medium shadow-sm">
            <Heart className="size-5" aria-hidden /> Favoritos
          </Link>
          <Link href={isLoggedIn ? "/cuenta" : "/ingresar"} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 text-[15px] font-medium text-white shadow-sm">
            <User className="size-5" aria-hidden /> {isLoggedIn ? "Mi cuenta" : "Ingresar"}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button ref={openBtn} type="button" onClick={() => setOpen(true)} className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-sand" aria-label="Abrir menú" aria-expanded={open}>
        <Menu className="size-6" />
      </button>
      {/* Portal: el header usa backdrop-blur y eso "atrapa" a los elementos fixed que tiene adentro. */}
      {open && typeof document !== "undefined" && createPortal(drawer, document.body)}
    </div>
  );
}
