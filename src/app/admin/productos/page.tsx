import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Shirt } from "lucide-react";
import { listProducts } from "@/server/queries/admin/products";
import { getCategoryOptions } from "@/server/queries/admin/categories";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductFilters } from "@/components/admin/products/product-filters";
import { ProductList } from "@/components/admin/products/product-list";

export const metadata: Metadata = { title: "Productos" };

type Props = { searchParams: Promise<{ q?: string; categoria?: string; estado?: string; page?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const [result, categories] = await Promise.all([
    listProducts({ q: params.q, categoria: params.categoria, estado: params.estado, page }),
    getCategoryOptions(),
  ]);

  const hasFilters = Boolean(params.q || params.categoria || (params.estado && params.estado !== "todos"));

  const nextParams = new URLSearchParams();
  if (params.q) nextParams.set("q", params.q);
  if (params.categoria) nextParams.set("categoria", params.categoria);
  if (params.estado) nextParams.set("estado", params.estado);
  nextParams.set("page", String(page + 1));

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={result.total === 0 ? undefined : `${result.total} ${result.total === 1 ? "producto" : "productos"}`}
        action={
          <LinkButton href="/admin/productos/nuevo" className="hidden sm:inline-flex">
            <Plus className="size-5" aria-hidden /> Agregar producto
          </LinkButton>
        }
      />

      <ProductFilters categories={categories} />

      {result.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={<Shirt className="size-7" />}
            title="No encontramos productos con esos filtros"
            description="Probá con otra palabra o sacá los filtros."
            action={
              <LinkButton href="/admin/productos" variant="secondary">
                Ver todos los productos
              </LinkButton>
            }
          />
        ) : (
          <EmptyState
            icon={<Shirt className="size-7" />}
            title="Todavía no cargaste productos"
            description="¡Agregá el primero! Solo necesitás un nombre, una foto y el precio."
            action={
              <LinkButton href="/admin/productos/nuevo" size="lg">
                <Plus className="size-5" aria-hidden /> Agregar producto
              </LinkButton>
            }
          />
        )
      ) : (
        <>
          <ProductList items={result.items} />
          {result.hasMore && (
            <div className="mt-6 flex justify-center">
              <LinkButton href={`/admin/productos?${nextParams.toString()}`} variant="secondary">
                Ver más productos
              </LinkButton>
            </div>
          )}
        </>
      )}

      {/* Botón flotante en celular */}
      <Link
        href="/admin/productos/nuevo"
        className="fixed bottom-20 right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-brand-600 pl-4 pr-5 text-base font-semibold text-white shadow-lg hover:bg-brand-hover sm:hidden"
      >
        <Plus className="size-6" aria-hidden /> Agregar producto
      </Link>
    </div>
  );
}
