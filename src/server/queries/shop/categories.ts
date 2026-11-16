import { prisma } from "@/lib/prisma";
import { cached, TAGS } from "@/lib/cache";

export type ShopCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  children: { id: string; name: string; slug: string }[];
};

/** Categorías raíz con sus subcategorías, para el menú y los filtros. Cacheado. */
export const getShopCategories = cached(
  async (): Promise<ShopCategory[]> =>
    prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        children: { where: { isActive: true }, orderBy: { position: "asc" }, select: { id: true, name: true, slug: true } },
      },
    }),
  "shop-categories",
  [TAGS.categories],
);

export const getCategoryBySlug = cached(
  async (slug: string) =>
    prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, description: true, parentId: true, parent: { select: { name: true, slug: true } } },
    }),
  "shop-category-by-slug",
  [TAGS.categories],
);
