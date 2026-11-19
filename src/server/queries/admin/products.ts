import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getProductDisplayStatus, LOW_STOCK_THRESHOLD, type ProductDisplayStatus } from "@/lib/labels";
import { getCategoryIdsWithChildren } from "@/server/queries/admin/categories";
import { lowStockGroups, type LowStockGroup } from "@/lib/stock";

export const PRODUCTS_PAGE_SIZE = 20;

export type ProductListFilter = "todos" | "publicado" | "borrador" | "sin-stock" | "poco-stock" | "destacados" | "archivados";

export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  totalStock: number;
  displayStatus: ProductDisplayStatus;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived: boolean;
  isFeatured: boolean;
  /** Talles con poco stock (≤ LOW_STOCK_THRESHOLD), agrupados por color. */
  lowStock: LowStockGroup[];
  imageUrl: string | null;
  categoryName: string;
  updatedAt: string;
  variants: { id: string; size: string; color: string; stock: number }[];
};

/** Condición Prisma: el producto tiene alguna combinación talle + color con poco stock. */
const hasLowStockVariant: Prisma.ProductVariantListRelationFilter = {
  some: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
};

/**
 * Productos publicados con alguna combinación talle + color con poco stock.
 * Devuelve productId → talles con poco stock agrupados por color.
 */
export async function getLowStockByProduct() {
  const rows = await prisma.productVariant.findMany({
    where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD }, product: { deletedAt: null, status: "ACTIVE" } },
    select: { productId: true, size: true, color: true, stock: true },
  });
  const byProduct = new Map<string, typeof rows>();
  for (const r of rows) byProduct.set(r.productId, [...(byProduct.get(r.productId) ?? []), r]);
  return new Map(Array.from(byProduct, ([id, variants]) => [id, lowStockGroups(variants)]));
}

export async function listProducts(params: { q?: string; categoria?: string; estado?: string; page?: number }) {
  const page = Math.max(1, params.page ?? 1);
  const estado = (params.estado ?? "todos") as ProductListFilter;

  const where: Prisma.ProductWhereInput = {};
  if (estado === "archivados") where.deletedAt = { not: null };
  else where.deletedAt = null;

  if (params.q?.trim()) where.name = { contains: params.q.trim(), mode: "insensitive" };

  if (params.categoria) {
    where.categoryId = { in: await getCategoryIdsWithChildren(params.categoria) };
  }

  if (estado === "publicado") {
    where.status = "ACTIVE";
    where.variants = { some: { stock: { gt: 0 } } };
  } else if (estado === "borrador") {
    where.status = "DRAFT";
  } else if (estado === "sin-stock") {
    where.status = "ACTIVE";
    where.variants = { none: { stock: { gt: 0 } } };
  } else if (estado === "poco-stock") {
    where.status = "ACTIVE";
    where.variants = hasLowStockVariant;
  } else if (estado === "destacados") {
    where.isFeatured = true;
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        price: true,
        compareAtPrice: true,
        status: true,
        isFeatured: true,
        deletedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: { orderBy: [{ isMain: "desc" }, { position: "asc" }], take: 1, select: { url: true } },
        variants: { orderBy: [{ size: "asc" }, { color: "asc" }], select: { id: true, size: true, color: true, stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items: ProductListItem[] = rows.map((p) => {
    const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
    return {
      id: p.id,
      name: p.name || "Producto sin nombre",
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
      totalStock,
      displayStatus: getProductDisplayStatus({ status: p.status, deletedAt: p.deletedAt, totalStock }),
      status: p.status,
      isArchived: p.deletedAt !== null,
      isFeatured: p.isFeatured,
      // Si el producto entero está sin stock ya lo dice el estado; no repetimos color por color.
      lowStock: totalStock > 0 ? lowStockGroups(p.variants) : [],
      imageUrl: p.images[0]?.url ?? null,
      categoryName: p.category.name,
      updatedAt: p.updatedAt.toISOString(),
      variants: p.variants,
    };
  });

  return { items, total, page, pageSize: PRODUCTS_PAGE_SIZE, hasMore: page * PRODUCTS_PAGE_SIZE < total };
}

export type ProductImageDTO = { id: string; url: string; isMain: boolean; position: number; color: string | null };

export type ProductFormDTO = {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  price: number | null;
  compareAtPrice: number | null;
  isFeatured: boolean;
  isNew: boolean;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived: boolean;
  slug: string;
  updatedAt: string;
  images: ProductImageDTO[];
  sizes: string[];
  colors: { name: string; hex: string | null }[];
  stock: Record<string, number>;
};

export async function getProductForForm(id: string): Promise<ProductFormDTO | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!p) return null;

  const sizes: string[] = [];
  const colors: { name: string; hex: string | null }[] = [];
  const stock: Record<string, number> = {};
  for (const v of p.variants) {
    if (!sizes.includes(v.size)) sizes.push(v.size);
    if (!colors.some((c) => c.name === v.color)) colors.push({ name: v.color, hex: v.colorHex });
    stock[`${v.size}::${v.color}`] = v.stock;
  }

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    price: p.price === null ? null : Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    status: p.status,
    isArchived: p.deletedAt !== null,
    slug: p.slug,
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((i) => ({ id: i.id, url: i.url, isMain: i.isMain, position: i.position, color: i.color })),
    sizes,
    colors,
    stock,
  };
}

/** Datos para la vista previa "así se ve en la tienda". */
export async function getProductPreview(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { include: { parent: true } },
      images: { orderBy: [{ isMain: "desc" }, { position: "asc" }] },
      variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name || "Producto sin nombre",
    description: p.description,
    status: p.status,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice === null ? null : Number(p.compareAtPrice),
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    categoryPath: [p.category.parent?.name, p.category.name].filter(Boolean).join(" › "),
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? p.name })),
    sizes: Array.from(new Set(p.variants.map((v) => v.size))),
    colors: Array.from(new Map(p.variants.map((v) => [v.color, v.colorHex])).entries()).map(([name, hex]) => ({ name, hex })),
    variants: p.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
    totalStock: p.variants.reduce((a, v) => a + v.stock, 0),
  };
}
