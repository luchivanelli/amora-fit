import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CreditCard, RefreshCcw, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getFavoriteIds, getProductBySlug, getRelatedProducts } from "@/server/queries/shop/products";
import { Gallery } from "@/components/product/gallery";
import { VariantSelector } from "@/components/product/variant-selector";
import { SelectedColorProvider } from "@/components/product/color-context";
import { SizeGuide } from "@/components/product/size-guide";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { ProductCard } from "@/components/catalog/product-card";
import { RevealOnScroll } from "@/components/motion/reveal-on-scroll";
import { Eyebrow, Sparkle } from "@/components/decor/sparkle";
import { Blob } from "@/components/decor/blob";
import { discountPercent, formatMoney } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Producto no encontrado" };
  const description = p.metaDesc ?? p.shortDesc ?? p.description.slice(0, 155);
  return {
    title: p.metaTitle ?? p.name,
    description,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: `${p.name} · AMORA`, description, type: "website", images: p.images[0] ? [{ url: p.images[0].url, alt: p.name }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const [p, favIds] = await Promise.all([getProductBySlug(slug), getFavoriteIds(session?.user?.id)]);
  if (!p) notFound();
  const related = await getRelatedProducts(p.id, p.category.id);

  const pct = discountPercent(p.price, p.compareAtPrice);
  const inStock = p.variants.some((v) => v.stock > 0);
  // Si el producto tiene un solo color, arranca elegido.
  const colorNames = Array.from(new Set(p.variants.map((v) => v.color)));
  const initialColor = colorNames.length === 1 ? colorNames[0] : null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDesc ?? p.description,
    image: p.images.map((i) => i.url),
    sku: p.variants[0]?.sku,
    brand: { "@type": "Brand", name: "AMORA" },
    category: p.category.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "ARS",
      lowPrice: Math.min(...p.variants.map((v) => v.price), p.price),
      highPrice: Math.max(...p.variants.map((v) => v.price), p.price),
      offerCount: p.variants.length,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${base}/producto/${p.slug}`,
    },
  };

  const accordion = "flex cursor-pointer list-none items-center justify-between py-1 font-sans text-[15px] font-semibold [&::-webkit-details-marker]:hidden";

  return (
    <div className="relative overflow-hidden">
      <Blob tone="blush" blur className="-left-40 top-20 size-[28rem] opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <nav aria-label="Estás en" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
          <Link href="/tienda" className="hover:text-ink">Tienda</Link>
          {p.category.parent && (
            <>
              <ChevronRight className="size-4" aria-hidden />
              <Link href={`/tienda?categoria=${p.category.parent.slug}`} className="hover:text-ink">{p.category.parent.name}</Link>
            </>
          )}
          <ChevronRight className="size-4" aria-hidden />
          <Link href={`/tienda?categoria=${p.category.parent?.slug ?? p.category.slug}${p.category.parent ? `&sub=${p.category.slug}` : ""}`} className="hover:text-ink">
            {p.category.name}
          </Link>
        </nav>

        <SelectedColorProvider initial={initialColor}>
        <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
          <Gallery
            images={p.images}
            badges={
              <>
                {p.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-paper/95 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#40432f]">
                    <Sparkle className="size-2.5 text-blush" /> Nuevo
                  </span>
                )}
                {pct && <span className="rounded-full bg-blush px-3 py-1 text-xs font-bold text-white">-{pct}%</span>}
              </>
            }
          />

          <div className="flex flex-col gap-6 md:sticky md:top-28 md:self-start">
            <div>
              <Eyebrow>{p.category.name}</Eyebrow>
              <h1 className="mt-2 text-4xl font-medium leading-tight sm:text-5xl">{p.name}</h1>
              <p className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className={`font-display text-3xl font-semibold ${pct ? "text-blush-deep" : ""}`}>{formatMoney(p.price)}</span>
                {pct && p.compareAtPrice && <span className="text-lg text-ink-muted line-through">{formatMoney(p.compareAtPrice)}</span>}
                {pct && <span className="rounded-full bg-blush-soft px-2.5 py-0.5 text-xs font-bold text-blush-deep">Ahorrás {pct}%</span>}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                <CreditCard className="size-4" aria-hidden /> Próximamente Mercado Pago
              </p>
            </div>

            {p.shortDesc && <p className="text-[15px] leading-relaxed text-ink-soft sm:text-base">{p.shortDesc}</p>}

            <VariantSelector variants={p.variants} basePrice={p.price} />

            <div className="flex flex-wrap items-center gap-4">
              <SizeGuide custom={p.sizeGuide} />
              <FavoriteButton productId={p.id} initial={favIds.has(p.id)} size="lg" label />
            </div>

            <ul className="grid grid-cols-3 gap-2 rounded-3xl border border-sand-dark/60 bg-surface p-3 text-center text-xs text-ink-soft">
              {[
                { icon: Truck, text: "Envío local gratis" },
                { icon: RefreshCcw, text: "Cambio sin cargo 30 días" },
                { icon: CreditCard, text: "Efectivo o transferencia" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex flex-col items-center gap-1.5 px-1 py-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="divide-y divide-sand-dark/60 border-y border-sand-dark/60">
              <details open className="group py-4">
                <summary className={accordion}>
                  Descripción
                  <span className="flex size-7 items-center justify-center rounded-full bg-sand transition-transform group-open:rotate-90">
                    <ChevronRight className="size-4" aria-hidden />
                  </span>
                </summary>
                <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{p.description}</div>
              </details>
              {(p.material || p.care) && (
                <details className="group py-4">
                  <summary className={accordion}>
                    Material y cuidados
                    <span className="flex size-7 items-center justify-center rounded-full bg-sand transition-transform group-open:rotate-90">
                      <ChevronRight className="size-4" aria-hidden />
                    </span>
                  </summary>
                  <div className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                    {p.material && <p>{p.material}</p>}
                    {p.care && <p className="mt-2">{p.care}</p>}
                  </div>
                </details>
              )}
              <details className="group py-4">
                <summary className={accordion}>
                  Envíos y cambios
                  <span className="flex size-7 items-center justify-center rounded-full bg-sand transition-transform group-open:rotate-90">
                    <ChevronRight className="size-4" aria-hidden />
                  </span>
                </summary>
                <div className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  Envío gratis dentro de Villa Constitución: coordinamos la entrega por WhatsApp. Tenés 30 días para cambiar talle o modelo sin cargo.{" "}
                  <Link href="/cambios-y-devoluciones" className="text-brand-700 underline-offset-4 hover:underline">Ver más</Link>.
                </div>
              </details>
            </div>
          </div>
        </div>
        </SelectedColorProvider>

        {related.length > 0 && (
          <RevealOnScroll as="section" stagger="[data-card]" className="mt-24">
            <Eyebrow>Combiná</Eyebrow>
            <h2 className="mb-8 mt-2 text-3xl font-medium sm:text-4xl">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {related.map((r) => (
                <ProductCard key={r.id} product={r} isFavorite={favIds.has(r.id)} />
              ))}
            </div>
          </RevealOnScroll>
        )}
      </div>
    </div>
  );
}
