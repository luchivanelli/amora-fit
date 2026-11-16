"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/server/queries/admin/products";
import type { ProductDisplayStatus } from "@/lib/labels";
import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { ProductRowActions } from "@/components/admin/products/product-row-actions";
import { QuickPrice } from "@/components/admin/products/quick-price";
import { QuickStock } from "@/components/admin/products/quick-stock";
import { FeaturedToggle } from "@/components/admin/products/featured-toggle";

function Thumb({ url, name, size = "size-16" }: { url: string | null; name: string; size?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-xl bg-sand", size)}>
      {url ? (
        <Image src={url} alt={name} fill sizes="96px" className="object-cover" />
      ) : (
        <Shirt className="absolute inset-0 m-auto size-6 text-ink-muted" aria-hidden />
      )}
    </span>
  );
}

function useVisibility(product: ProductListItem) {
  const [visible, setVisible] = useState(product.status === "ACTIVE");
  const displayStatus: ProductDisplayStatus = product.isArchived
    ? "archivado"
    : !visible
      ? "borrador"
      : product.totalStock <= 0
        ? "sin-stock"
        : "publicado";
  return { visible, setVisible, displayStatus };
}

/** Celular: tarjeta. */
function ProductCard({ product }: { product: ProductListItem }) {
  const { visible, setVisible, displayStatus } = useVisibility(product);
  const editHref = product.isArchived ? "#" : `/admin/productos/${product.id}`;

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-sand-dark/70 bg-surface p-3">
      <Link href={editHref} className="shrink-0" tabIndex={-1} aria-hidden>
        <Thumb url={product.imageUrl} name={product.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={editHref} className="block truncate font-medium text-ink">
          {product.name}
        </Link>
        <p className="truncate text-sm text-ink-muted">{product.categoryName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
          <QuickPrice productId={product.id} price={product.price} disabled={product.isArchived} />
          <QuickStock productId={product.id} variants={product.variants} disabled={product.isArchived} />
        </div>
        <div className="mt-1.5">
          <ProductStatusBadge status={displayStatus} />
        </div>
      </div>
      <div className="flex flex-col items-center">
        {!product.isArchived && <FeaturedToggle productId={product.id} name={product.name} featured={product.isFeatured} />}
        <ProductRowActions product={product} visible={visible} onVisibilityChange={setVisible} />
      </div>
    </li>
  );
}

/** Escritorio: fila de tabla. */
function ProductTableRow({ product }: { product: ProductListItem }) {
  const { visible, setVisible, displayStatus } = useVisibility(product);
  const editHref = `/admin/productos/${product.id}`;

  return (
    <tr className="border-b border-sand last:border-b-0">
      <td className="py-3 pl-3 pr-2 align-middle">
        <Thumb url={product.imageUrl} name={product.name} size="size-14" />
      </td>
      <td className="py-3 pr-4 align-middle">
        {product.isArchived ? (
          <span className="block truncate font-medium text-ink">{product.name}</span>
        ) : (
          <Link href={editHref} className="block truncate font-medium text-ink hover:underline">
            {product.name}
          </Link>
        )}
        <span className="block truncate text-sm text-ink-muted">{product.categoryName}</span>
      </td>
      <td className="whitespace-nowrap py-3 pr-4 align-middle">
        <QuickPrice productId={product.id} price={product.price} disabled={product.isArchived} />
      </td>
      <td className="whitespace-nowrap py-3 pr-4 align-middle">
        <QuickStock productId={product.id} variants={product.variants} disabled={product.isArchived} />
      </td>
      <td className="whitespace-nowrap py-3 pr-4 align-middle">
        <ProductStatusBadge status={displayStatus} />
      </td>
      <td className="py-3 pr-3 text-right align-middle">
        <div className="flex items-center justify-end gap-1">
          {!product.isArchived && <FeaturedToggle productId={product.id} name={product.name} featured={product.isFeatured} />}
          {!product.isArchived && (
            <Link href={editHref} className="inline-flex h-10 items-center rounded-lg px-3 text-[15px] font-medium text-brand-700 hover:bg-brand-50">
              Editar
            </Link>
          )}
          <ProductRowActions product={product} visible={visible} onVisibilityChange={setVisible} />
        </div>
      </td>
    </tr>
  );
}

export function ProductList({ items }: { items: ProductListItem[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-2xl border border-sand-dark/70 bg-surface md:block">
        <table className="w-full table-fixed text-[15px]">
          <colgroup>
            <col className="w-[4.75rem]" />
            <col />
            <col className="w-36" />
            <col className="w-44" />
            <col className="w-32" />
            <col className="w-52" />
          </colgroup>
          <thead className="bg-sand/50 text-left text-sm text-ink-soft">
            <tr>
              <th className="py-3 pl-3 pr-2 font-medium">Foto</th>
              <th className="py-3 pr-4 font-medium">Producto</th>
              <th className="py-3 pr-4 font-medium">Precio</th>
              <th className="py-3 pr-4 font-medium">Stock</th>
              <th className="py-3 pr-4 font-medium">Estado</th>
              <th className="py-3 pr-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <ProductTableRow key={p.id} product={p} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
