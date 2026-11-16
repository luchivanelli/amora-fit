import type { Metadata } from "next";
import Link from "next/link";
import { Shirt, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { getShopCategories, getCategoryBySlug } from "@/server/queries/shop/categories";
import { CATALOG_PAGE_SIZE, getCatalog, getCatalogFacets, getFavoriteIds, type CatalogParams } from "@/server/queries/shop/products";
import { CatalogSidebar, CatalogToolbar } from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/catalog/product-card";
import { Pagination } from "@/components/catalog/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { Blob } from "@/components/decor/blob";
import { Eyebrow } from "@/components/decor/sparkle";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<CatalogParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const slug = p.sub || p.categoria;
  const cat = slug ? await getCategoryBySlug(slug) : null;
  const title = p.q ? `Resultados para “${p.q}”` : cat ? `${cat.name}${cat.parent ? ` · ${cat.parent.name}` : ""}` : "Tienda";
  const description = cat?.description ?? "Descubrí ropa íntima y deportiva cómoda, suave y pensada para vos. Envíos gratis dentro de Villa Constitución.";
  return { title, description, openGraph: { title: `${title} · AMORA`, description } };
}

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  const [categories, facets, result, favIds] = await Promise.all([
    getShopCategories(),
    getCatalogFacets(),
    getCatalog(params),
    getFavoriteIds(session?.user?.id),
  ]);

  const root = params.categoria ? categories.find((c) => c.slug === params.categoria) : null;
  const sub = params.sub ? root?.children.find((s) => s.slug === params.sub) : null;
  const isNew = params.orden === "novedades";
  const title = params.q ? `Resultados para “${params.q}”` : sub?.name ?? root?.name ?? (isNew ? "Nuevos ingresos" : "Toda la tienda");

  // Chips de navegación rápida: raíces, o subcategorías cuando ya hay una raíz elegida.
  const chips: { href: string; label: string; active: boolean }[] = root
    ? [
        { href: `/tienda?categoria=${root.slug}`, label: `Todo ${root.name.toLowerCase()}`, active: !sub },
        ...root.children.map((s) => ({ href: `/tienda?categoria=${root.slug}&sub=${s.slug}`, label: s.name, active: sub?.slug === s.slug })),
      ]
    : [
        { href: "/tienda", label: "Todo", active: !isNew && !params.q },
        ...categories.map((c) => ({ href: `/tienda?categoria=${c.slug}`, label: c.name, active: false })),
        { href: "/tienda?orden=novedades", label: "Nuevos ingresos", active: isNew },
      ];

  return (
    <div className="relative overflow-hidden">
      <Blob tone="brand" blur className="-right-40 -top-32 size-[30rem] opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          {root && sub ? (
            <Link href={`/tienda?categoria=${root.slug}`} className="inline-block">
              <Eyebrow>{root.name}</Eyebrow>
            </Link>
          ) : (
            <Eyebrow>{params.q ? "Búsqueda" : "Tienda"}</Eyebrow>
          )}
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl lg:text-6xl">{title}</h1>
          {root?.description && !sub && <p className="mt-3 max-w-2xl text-[15px] text-ink-soft sm:text-base">{root.description}</p>}
        </div>

        <nav aria-label="Categorías" className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {root && (
            <Link href="/tienda" className="shrink-0 rounded-full border border-sand-dark bg-surface px-4 py-2 text-[15px] text-ink-soft transition-colors hover:border-brand-400 hover:text-ink">
              ← Toda la tienda
            </Link>
          )}
          {chips.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              aria-current={c.active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[15px] font-medium transition-all",
                c.active ? "border-brand-600 bg-brand-600 text-white shadow-sm" : "border-sand-dark bg-surface text-ink hover:-translate-y-px hover:border-brand-400 hover:bg-brand-50",
              )}
            >
              {c.label === "Nuevos ingresos" && <Sparkles className="size-4" aria-hidden />}
              {c.label}
            </Link>
          ))}
        </nav>

        <CatalogToolbar categories={categories} facets={facets} total={result.total} />

        <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
          <CatalogSidebar categories={categories} facets={facets} />
          <div>
            {result.items.length === 0 ? (
              <EmptyState
                icon={<Shirt className="size-7" />}
                title={params.q ? `No encontramos nada para “${params.q}”` : "No encontramos productos con esos filtros"}
                description={params.q ? "Probá con otra palabra o explorá por categoría." : "Probá con otro talle, color o categoría."}
                action={<LinkButton href="/tienda" variant="secondary">Ver toda la tienda</LinkButton>}
              />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
                  {result.items.map((p, i) => (
                    <ProductCard key={p.id} product={p} isFavorite={favIds.has(p.id)} priority={i < 4} />
                  ))}
                </div>
                <Pagination page={result.page} totalPages={result.totalPages} total={result.total} pageSize={CATALOG_PAGE_SIZE} basePath="/tienda" params={params as Record<string, string | undefined>} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
