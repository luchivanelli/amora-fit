import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllProductSlugs } from "@/server/queries/shop/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const statics: MetadataRoute.Sitemap = ["", "/tienda", "/contacto", "/preguntas-frecuentes", "/cambios-y-devoluciones", "/terminos", "/privacidad"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "" || p === "/tienda" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/tienda" ? 0.9 : 0.4,
  }));

  try {
    const [products, categories] = await Promise.all([
      getAllProductSlugs(),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, parent: { select: { slug: true } }, updatedAt: true } }),
    ]);
    return [
      ...statics,
      ...categories.map((c) => ({
        url: c.parent ? `${base}/tienda?categoria=${c.parent.slug}&sub=${c.slug}` : `${base}/tienda?categoria=${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((p) => ({ url: `${base}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ];
  } catch {
    return statics;
  }
}
