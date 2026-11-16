import type { Metadata } from "next";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import fondoIntimo from "@/images/fondo-intimo.jpeg";
import fondoDeportivo from "@/images/fondo-deportivo.jpeg";
import { auth } from "@/lib/auth";
import { getShopCategories } from "@/server/queries/shop/categories";
import { getFavoriteIds, getFeaturedProducts, getNewProducts } from "@/server/queries/shop/products";
import { Hero } from "@/components/home/hero";
import { Benefits } from "@/components/home/benefits";
import { Lookbook } from "@/components/home/lookbook";
import { ProductCard } from "@/components/catalog/product-card";
import { RevealOnScroll } from "@/components/motion/reveal-on-scroll";
import { Marquee } from "@/components/decor/marquee";
import { Eyebrow } from "@/components/decor/sparkle";

export const metadata: Metadata = {
  title: "AMORA · Ropa íntima y deportiva",
  description: "Prendas suaves y cómodas, pensadas para que te sientas vos misma todos los días. Envíos gratis dentro de Villa Constitución.",
  openGraph: { title: "AMORA · Ropa íntima y deportiva", description: "Prendas suaves y cómodas, pensadas para que te sientas vos misma todos los días.", type: "website" },
};

// Fondos de las tarjetas de categoría (src/images). Para otras categorías se usa la foto cargada desde el panel.
const CATEGORY_BACKGROUNDS: Record<string, StaticImageData> = {
  "ropa-intima": fondoIntimo,
  "ropa-deportiva": fondoDeportivo,
};

const MARQUEE = ["Envío local gratis", "Cambios sin cargo por 30 días", "Talles reales del XS al XXL", "Próximamente Mercado Pago", "Prendas pensadas en vos"];

export default async function HomePage() {
  const session = await auth();
  const [categories, featured, fresh, favIds] = await Promise.all([
    getShopCategories(),
    getFeaturedProducts(8),
    getNewProducts(8),
    getFavoriteIds(session?.user?.id),
  ]);

  return (
    <>
      <Hero />

      <Marquee items={MARQUEE} className="border-y border-brand-200/60 bg-brand-100 py-4 text-brand-800" />

      {categories.length > 0 && (
        <RevealOnScroll as="section" id="contenido" stagger="[data-cat]" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Explorá</Eyebrow>
              <h2 className="mt-2 text-3xl font-medium sm:text-4xl">Elegí por dónde empezar</h2>
            </div>
            <Link href="/tienda" className="group inline-flex items-center gap-1 text-[15px] font-medium text-brand-700">
              Ver toda la tienda <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {categories.slice(0, 2).map((c, i) => (
              <Link key={c.id} href={`/tienda?categoria=${c.slug}`} data-cat className="group relative block aspect-[4/3] overflow-hidden rounded-4xl bg-sand shadow-sm transition-shadow duration-500 hover:shadow-lift sm:aspect-[5/4]">
                {CATEGORY_BACKGROUNDS[c.slug] ? (
                  <Image src={CATEGORY_BACKGROUNDS[c.slug]} alt="" fill placeholder="blur" sizes="(max-width: 640px) 100vw, 50vw" className="theme-dim object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
                ) : (
                  <Image src={c.imageUrl ?? fondoIntimo} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="theme-dim object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/70 via-scrim/15 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className={`absolute inset-0 ${i === 0 ? "bg-blush" : "bg-brand-500"} opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-30`} />
                <span className="absolute left-5 top-5 rounded-full bg-paper/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#40432f]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white sm:p-7">
                  <div>
                    <h3 className="text-3xl font-medium sm:text-4xl lg:text-5xl">{c.name}</h3>
                    {c.children.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {c.children.map((s) => (
                          <li key={s.id} className="rounded-full border border-white/40 bg-white/10 px-2.5 py-0.5 text-xs backdrop-blur-sm">
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-paper text-[#2b2a26] transition-transform duration-500 group-hover:rotate-[-35deg] group-hover:scale-110">
                    <ArrowRight className="size-5" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </RevealOnScroll>
      )}

      {featured.length > 0 && (
        <ProductSection eyebrow="Elegidos por nosotras" title="Productos destacados" href="/tienda" products={featured} favIds={favIds} />
      )}

      <Lookbook />

      <Benefits />

      {fresh.length > 0 && (
        <ProductSection eyebrow="Recién llegados" title="Nuevos ingresos" href="/tienda?orden=novedades" products={fresh} favIds={favIds} />
      )}
    </>
  );
}

function ProductSection({ eyebrow, title, href, products, favIds }: { eyebrow: string; title: string; href: string; products: Awaited<ReturnType<typeof getFeaturedProducts>>; favIds: Set<string> }) {
  return (
    <RevealOnScroll as="section" stagger="[data-card]" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-2 text-3xl font-medium sm:text-4xl">{title}</h2>
        </div>
        <Link href={href} className="group hidden h-11 items-center gap-1.5 rounded-full border border-sand-dark bg-surface px-5 text-[15px] font-medium text-ink transition-colors hover:border-brand-400 hover:bg-brand-50 sm:inline-flex">
          Ver todo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} isFavorite={favIds.has(p.id)} />
        ))}
      </div>
      <Link href={href} className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-full border border-sand-dark bg-surface px-5 text-[15px] font-medium sm:hidden">
        Ver todo <ArrowRight className="size-4" aria-hidden />
      </Link>
    </RevealOnScroll>
  );
}
