"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LowStockGroup } from "@/lib/stock";
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

/** Poco stock: una fila por color con un chip por talle ("XL agotado", "L · 1"). */
function LowStockNote({ groups, className }: { groups: LowStockGroup[]; className?: string }) {
  if (groups.length === 0) return null;
  return (
    <div className={cn("rounded-xl bg-warn-soft px-3 py-2", className)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warn">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> Poco stock
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {groups.map((g) => (
          <li key={g.color} className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="mr-0.5 font-medium text-ink">{g.color}</span>
            {g.sizes.map((s) => (
              <span
                key={s.size}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  s.stock === 0 ? "bg-danger-soft text-danger" : "bg-surface text-warn",
                )}
              >
                {s.size} · {s.stock === 0 ? "agotado" : s.stock}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
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
    <li className="rounded-2xl border border-sand-dark/70 bg-surface p-3">
      {/* 1. Qué producto es: foto, nombre, categoría y estado. Acciones arriba a la derecha. */}
      <div className="flex items-start gap-3">
        <Link href={editHref} className="shrink-0" tabIndex={-1} aria-hidden>
          <Thumb url={product.imageUrl} name={product.name} />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <Link href={editHref} className="line-clamp-2 font-medium leading-snug text-ink">
            {product.name}
          </Link>
          <p className="mt-0.5 truncate text-sm text-ink-muted">{product.categoryName}</p>
          <div className="mt-1.5">
            <ProductStatusBadge status={displayStatus} />
          </div>
        </div>
        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          {!product.isArchived && <FeaturedToggle productId={product.id} name={product.name} featured={product.isFeatured} />}
          <ProductRowActions product={product} visible={visible} onVisibilityChange={setVisible} />
        </div>
      </div>

      {/* 2. Precio y stock, con etiqueta, para editarlos de un toque. */}
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-sand pt-3 text-[15px]">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Precio</dt>
          <dd>
            <QuickPrice productId={product.id} name={product.name} price={product.price} disabled={product.isArchived} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Stock</dt>
          <dd>
            <QuickStock productId={product.id} variants={product.variants} disabled={product.isArchived} />
          </dd>
        </div>
      </dl>

      {/* 3. Avisos de poco stock, a todo el ancho. */}
      <LowStockNote groups={product.lowStock} className="mt-2" />
    </li>
  );
}

/** Escritorio: fila de tabla. */
function ProductTableRow({ product }: { product: ProductListItem }) {
  const { visible, setVisible, displayStatus } = useVisibility(product);
  const editHref = `/admin/productos/${product.id}`;

  return (
    <tr className="border-b border-sand last:border-b-0">
      <td className="py-3 pl-3 pr-4 align-middle">
        <Thumb url={product.imageUrl} name={product.name} size="size-14" />
      </td>
      <td className="py-3 pr-4 align-middle">
        {product.isArchived ? (
          <span className="line-clamp-2 font-medium leading-snug text-ink">{product.name}</span>
        ) : (
          <Link href={editHref} className="line-clamp-2 font-medium leading-snug text-ink hover:underline">
            {product.name}
          </Link>
        )}
        <span className="mt-0.5 block truncate text-sm text-ink-muted">{product.categoryName}</span>
      </td>
      <td className="py-3 pr-4 align-middle">
        <QuickPrice productId={product.id} name={product.name} price={product.price} disabled={product.isArchived} />
      </td>
      <td className="py-3 pr-4 align-middle">
        <QuickStock productId={product.id} variants={product.variants} disabled={product.isArchived} />
        <LowStockNote groups={product.lowStock} className="mt-1" />
      </td>
      <td className="py-3 pr-4 align-middle">
        <ProductStatusBadge status={displayStatus} />
      </td>
      <td className="py-3 pr-3 align-middle">
        {/* "Editar" está en el nombre y en el menú "···": así la columna queda angosta. */}
        <div className="flex items-center justify-end">
          {!product.isArchived && <FeaturedToggle productId={product.id} name={product.name} featured={product.isFeatured} />}
          <ProductRowActions product={product} visible={visible} onVisibilityChange={setVisible} />
        </div>
      </td>
    </tr>
  );
}

export function ProductList({ items }: { items: ProductListItem[] }) {
  return (
    <>
      {/* Tarjetas hasta que la tabla entra cómoda (en tablet, de a dos). */}
      <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-2xl border border-sand-dark/70 bg-surface lg:block">
        <table className="w-full table-fixed text-[15px]">
          {/* Producto con ancho acotado y Stock con el resto: ahí van los avisos por color. */}
          <colgroup>
            <col className="w-[5.5rem]" />
            <col className="w-[28%]" />
            <col className="w-32" />
            <col />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-sand/50 text-left text-sm text-ink-soft">
            <tr>
              <th className="py-3 pl-3 pr-4 font-medium">Foto</th>
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
