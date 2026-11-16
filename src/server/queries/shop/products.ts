import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cached, TAGS } from "@/lib/cache";

export const CATALOG_PAGE_SIZE = 8;

export type ProductCardDTO = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  isNew: boolean;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  inStock: boolean;
  categoryName: string;
  colors: { name: string; hex: string | null }[];
};

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  isNew: true,
  category: { select: { name: true } },
  images: { orderBy: [{ isMain: "desc" }, { position: "asc" }], take: 2, select: { url: true } },
  variants: { where: { isActive: true }, select: { stock: true, color: true, colorHex: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): ProductCardDTO {
  const colors = new Map<string, string | null>();
  for (const v of p.variants) if (!colors.has(v.color)) colors.set(v.color, v.colorHex);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    isNew: p.isNew,
    imageUrl: p.images[0]?.url ?? null,
    hoverImageUrl: p.images[1]?.url ?? null,
    inStock: p.variants.some((v) => v.stock > 0),
    categoryName: p.category.name,
    colors: Array.from(colors, ([name, hex]) => ({ name, hex })),
  };
}

const visible: Prisma.ProductWhereInput = { status: "ACTIVE", deletedAt: null };
const PRODUCT_TAGS = [TAGS.products, TAGS.categories];

export const getFeaturedProducts = cached(
  async (take = 8) => {
    const rows = await prisma.product.findMany({ where: { ...visible, isFeatured: true }, orderBy: { position: "asc" }, take, select: cardSelect });
    return rows.map(toCard);
  },
  "shop-featured",
  PRODUCT_TAGS,
);

export const getNewProducts = cached(
  async (take = 8) => {
    const rows = await prisma.product.findMany({
      where: { ...visible, OR: [{ isNew: true }, { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } }] },
      orderBy: { createdAt: "desc" },
      take,
      select: cardSelect,
    });
    return rows.map(toCard);
  },
  "shop-new",
  PRODUCT_TAGS,
);

export type CatalogParams = {
  categoria?: string; // slug raíz
  sub?: string; // slug subcategoría
  talle?: string;
  color?: string;
  min?: string;
  max?: string;
  orden?: string; // novedades | precio-asc | precio-desc
  page?: string;
  q?: string; // búsqueda por texto
};

export const getCatalog = cached(
  async (params: CatalogParams) => {
    const page = Math.max(1, Number(params.page) || 1);
    const where: Prisma.ProductWhereInput = { ...visible };

    const q = params.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { shortDesc: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (params.sub) {
      where.category = { slug: params.sub };
    } else if (params.categoria) {
      where.category = { OR: [{ slug: params.categoria }, { parent: { slug: params.categoria } }] };
    }

    const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
    if (params.talle) variantFilter.size = { equals: params.talle, mode: "insensitive" };
    if (params.color) variantFilter.color = { equals: params.color, mode: "insensitive" };
    if (params.talle || params.color) where.variants = { some: variantFilter };

    const min = Number(params.min);
    const max = Number(params.max);
    if (min > 0 || max > 0) {
      where.price = { ...(min > 0 ? { gte: min } : {}), ...(max > 0 ? { lte: max } : {}) };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.orden === "precio-asc" ? { price: "asc" } : params.orden === "precio-desc" ? { price: "desc" } : { createdAt: "desc" };

    const [rows, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip: (page - 1) * CATALOG_PAGE_SIZE, take: CATALOG_PAGE_SIZE, select: cardSelect }),
      prisma.product.count({ where }),
    ]);

    return { items: rows.map(toCard), total, page, totalPages: Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE)) };
  },
  "shop-catalog",
  PRODUCT_TAGS,
);

/** Talles y colores disponibles en productos publicados, para los filtros. */
export const getCatalogFacets = cached(
  async () => {
    const [variants, prices] = await Promise.all([
      prisma.productVariant.findMany({
        where: { isActive: true, product: visible },
        select: { size: true, color: true, colorHex: true },
        distinct: ["size", "color"],
      }),
      prisma.product.aggregate({ where: visible, _min: { price: true }, _max: { price: true } }),
    ]);
    const sizes = Array.from(new Set(variants.map((v) => v.size)));
    const letters = ["XS", "S", "M", "L", "XL", "XXL"];
    sizes.sort((a, b) => {
      const ia = letters.indexOf(a), ib = letters.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return Number(a) - Number(b) || a.localeCompare(b);
    });
    const colors = new Map<string, string | null>();
    for (const v of variants) if (!colors.has(v.color)) colors.set(v.color, v.colorHex);
    return {
      sizes,
      colors: Array.from(colors, ([name, hex]) => ({ name, hex })),
      minPrice: Number(prices._min.price ?? 0),
      maxPrice: Number(prices._max.price ?? 0),
    };
  },
  "shop-facets",
  PRODUCT_TAGS,
);

export type ProductDetailDTO = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export const getProductBySlug = cached(
  async (slug: string) => {
    const p = await prisma.product.findFirst({
      where: { slug, ...visible },
      include: {
        category: { select: { id: true, name: true, slug: true, parent: { select: { name: true, slug: true } } } },
        images: { orderBy: [{ isMain: "desc" }, { position: "asc" }], select: { id: true, url: true, alt: true, color: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true, size: true, color: true, colorHex: true, stock: true, price: true, sku: true } },
      },
    });
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDesc: p.shortDesc,
      material: p.material,
      care: p.care,
      sizeGuide: p.sizeGuide,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
      isNew: p.isNew,
      metaTitle: p.metaTitle,
      metaDesc: p.metaDesc,
      updatedAt: p.updatedAt.toISOString(),
      category: p.category,
      images: p.images.map((i) => ({ ...i, alt: i.alt ?? p.name })),
      variants: p.variants.map((v) => ({ ...v, price: v.price === null ? Number(p.price) : Number(v.price) })),
    };
  },
  "shop-product",
  PRODUCT_TAGS,
);

export const getRelatedProducts = cached(
  async (productId: string, categoryId: string, take = 4) => {
    const rows = await prisma.product.findMany({
      where: { ...visible, id: { not: productId }, categoryId },
      orderBy: { createdAt: "desc" },
      take,
      select: cardSelect,
    });
    if (rows.length < take) {
      const more = await prisma.product.findMany({
        where: { ...visible, id: { notIn: [productId, ...rows.map((r) => r.id)] } },
        orderBy: { isFeatured: "desc" },
        take: take - rows.length,
        select: cardSelect,
      });
      rows.push(...more);
    }
    return rows.map(toCard);
  },
  "shop-related",
  PRODUCT_TAGS,
);

/* ───── Lecturas por usuario: no se cachean ───── */

export async function getFavoriteProducts(userId: string) {
  const favs = await prisma.favorite.findMany({
    where: { userId, product: visible },
    orderBy: { createdAt: "desc" },
    select: { product: { select: cardSelect } },
  });
  return favs.map((f) => toCard(f.product));
}

export async function getFavoriteIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const favs = await prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(favs.map((f) => f.productId));
}

export async function getAllProductSlugs() {
  return prisma.product.findMany({ where: visible, select: { slug: true, updatedAt: true } });
}
