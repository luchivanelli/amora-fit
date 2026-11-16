"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardDTO } from "@/server/queries/shop/products";
import { discountPercent, formatMoney, cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { Sparkle } from "@/components/decor/sparkle";
import { Swatch } from "@/components/ui/swatch";

gsap.registerPlugin(useGSAP);

export function ProductCard({ product, isFavorite = false, priority = false }: { product: ProductCardDTO; isFavorite?: boolean; priority?: boolean }) {
  const img = useRef<HTMLDivElement>(null);
  const pct = discountPercent(product.price, product.compareAtPrice);

  const { contextSafe } = useGSAP({ scope: img });
  const hover = contextSafe((on: boolean) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(img.current!.querySelector("[data-main]"), { scale: on ? 1.06 : 1, duration: 0.7, ease: "power2.out" });
  });

  return (
    <article className="group relative flex flex-col" data-card>
      <Link href={`/producto/${product.slug}`} className="lift block rounded-3xl" onMouseEnter={() => hover(true)} onMouseLeave={() => hover(false)}>
        <div ref={img} className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand">
          {product.imageUrl ? (
            <>
              <Image data-main src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="theme-dim object-cover" priority={priority} />
              {product.hoverImageUrl && (
                <Image src={product.hoverImageUrl} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="theme-dim object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-ink-muted">
              <Sparkle className="size-6 text-brand-300" />
              Sin foto
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.isNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-paper/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#40432f]">
                <Sparkle className="size-2.5 text-blush" /> Nuevo
              </span>
            )}
            {pct && <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-bold text-white">-{pct}%</span>}
          </div>
          {!product.inStock && (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-paper/95 py-1.5 text-center text-xs font-semibold text-[#6b685f]">Sin stock</span>
          )}
          {product.inStock && (
            <span className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 items-center justify-center gap-1 rounded-full bg-paper/95 py-2 text-center text-sm font-medium text-[#2b2a26] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
              Ver producto <ArrowUpRight className="size-4" aria-hidden />
            </span>
          )}
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <FavoriteButton productId={product.id} initial={isFavorite} />
      </div>
      <div className="mt-3.5 flex flex-col gap-0.5 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{product.categoryName}</p>
        <Link href={`/producto/${product.slug}`} className="line-clamp-2 font-display text-lg font-medium leading-snug text-ink transition-colors hover:text-brand-700">
          {product.name}
        </Link>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className={cn("font-semibold", pct && "text-blush-deep")}>{formatMoney(product.price)}</span>
          {pct && product.compareAtPrice && <span className="text-sm text-ink-muted line-through">{formatMoney(product.compareAtPrice)}</span>}
        </p>
        {product.colors.length > 1 && (
          <div className="mt-1.5 flex gap-1.5" aria-label={`${product.colors.length} colores`}>
            {product.colors.slice(0, 6).map((c) => (
              <Swatch key={c.name} hex={c.hex} title={c.name} className="size-3.5 ring-1 ring-surface" />
            ))}
            {product.colors.length > 6 && <span className="text-[11px] text-ink-muted">+{product.colors.length - 6}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
