"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import type { ShopCategory } from "@/server/queries/shop/categories";
import { cn } from "@/lib/utils";

export function DesktopNav({ categories }: { categories: ShopCategory[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const pathname = usePathname();
  const search = useSearchParams();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar al navegar (incluye cambios de ?categoria=…) y con Escape.
  useEffect(() => setOpenId(null), [pathname, search]);
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };
  const close = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(null);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const currentCat = search.get("categoria");
  const linkCls = "link-underline py-1 text-[15px] font-medium text-ink transition-colors hover:text-brand-700";

  return (
    <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
      <Link href="/tienda" aria-current={pathname === "/tienda" && !currentCat ? "page" : undefined} className={linkCls}>
        Tienda
      </Link>
      {categories.map((c) => {
        const isOpen = openId === c.id;
        const hasChildren = c.children.length > 0;
        return (
          <div
            key={c.id}
            className="relative"
            onMouseEnter={() => hasChildren && open(c.id)}
            onMouseLeave={scheduleClose}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenId(null);
            }}
          >
            <div className="flex items-center gap-0.5">
              <Link href={`/tienda?categoria=${c.slug}`} onClick={close} aria-current={currentCat === c.slug ? "page" : undefined} className={cn(linkCls, "py-5")}>
                {c.name}
              </Link>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => (isOpen ? setOpenId(null) : open(c.id))}
                  onFocus={() => open(c.id)}
                  aria-expanded={isOpen}
                  aria-label={`Ver subcategorías de ${c.name}`}
                  className="rounded-full p-1 text-ink-muted hover:text-ink"
                >
                  <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} aria-hidden />
                </button>
              )}
            </div>
            {hasChildren && isOpen && (
              <div className="absolute left-0 top-full z-50 min-w-56 animate-fade-up rounded-3xl border border-sand-dark/60 bg-surface p-2 shadow-lift">
                {c.children.map((s) => (
                  <Link key={s.id} href={`/tienda?categoria=${c.slug}&sub=${s.slug}`} onClick={close} className="block rounded-2xl px-4 py-2.5 text-[15px] text-ink-soft transition-colors hover:bg-brand-50 hover:text-ink">
                    {s.name}
                  </Link>
                ))}
                <Link href={`/tienda?categoria=${c.slug}`} onClick={close} className="mt-1 flex items-center gap-2 rounded-2xl border-t border-sand px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
                  <Sparkles className="size-4" aria-hidden /> Ver todo {c.name.toLowerCase()}
                </Link>
              </div>
            )}
          </div>
        );
      })}
      <Link href="/tienda?orden=novedades" className={cn(linkCls, "inline-flex items-center gap-1.5 text-blush-deep hover:text-blush-deep")}>
        <Sparkles className="size-4" aria-hidden /> Novedades
      </Link>
    </nav>
  );
}
