import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Shirt } from "lucide-react";
import { getProductPreview } from "@/server/queries/admin/products";
import { LinkButton } from "@/components/ui/button";
import { discountPercent, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Vista previa" };

export default async function ProductPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProductPreview(id);
  if (!p) notFound();

  const pct = discountPercent(p.price, p.compareAtPrice);
  const [main, ...rest] = p.images;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-brand-900">
          <strong>Vista previa.</strong> Así va a verse este producto en la tienda{p.status !== "ACTIVE" && " cuando lo publiques"}.
        </p>
        <LinkButton href={`/admin/productos/${p.id}`} variant="secondary" size="sm">
          ‹ Volver a editar
        </LinkButton>
      </div>

      <article className="mx-auto grid max-w-5xl grid-cols-1 gap-8 rounded-2xl border border-sand-dark/70 bg-surface p-5 sm:p-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
            {main ? (
              <Image src={main.url} alt={main.alt} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" priority />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
                <Shirt className="size-10" aria-hidden />
                <span className="text-sm">Todavía no hay fotos</span>
              </div>
            )}
            {p.isNew && <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-brand-800">Nuevo</span>}
            {pct && <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">-{pct}%</span>}
          </div>
          {rest.length > 0 && (
            <ul className="grid grid-cols-4 gap-2">
              {rest.map((img) => (
                <li key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-sand">
                  <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm uppercase tracking-wide text-ink-muted">{p.categoryPath}</p>
            <h1 className="mt-1 text-4xl font-medium">{p.name}</h1>
          </div>
          <p className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold">{formatMoney(p.price)}</span>
            {pct && p.compareAtPrice && <span className="text-ink-muted line-through">{formatMoney(p.compareAtPrice)}</span>}
          </p>

          {p.sizes.length > 0 && (
            <div>
              <p className="mb-2 text-[15px] font-medium">Talle</p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => {
                  const has = p.variants.some((v) => v.size === s && v.stock > 0);
                  return (
                    <span key={s} className={has ? "rounded-full border border-ink px-4 py-2 text-[15px]" : "rounded-full border border-sand-dark px-4 py-2 text-[15px] text-ink-muted line-through"}>
                      {s}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {p.colors.length > 0 && (
            <div>
              <p className="mb-2 text-[15px] font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-2 rounded-full border border-sand-dark px-3 py-2 text-[15px]">
                    <span aria-hidden className="size-4 rounded-full border border-ink/10" style={{ backgroundColor: c.hex ?? "#ddd" }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button type="button" disabled className="h-14 rounded-xl bg-brand-600 text-lg font-medium text-white opacity-90" aria-disabled>
            {p.totalStock > 0 ? "Agregar al carrito" : "Sin stock"}
          </button>

          {p.description ? (
            <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{p.description}</div>
          ) : (
            <p className="text-[15px] italic text-ink-muted">Todavía no escribiste la descripción.</p>
          )}
        </div>
      </article>
    </div>
  );
}
