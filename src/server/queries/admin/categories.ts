import { prisma } from "@/lib/prisma";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  position: number;
  productCount: number;
  children: CategoryNode[];
};

/** Árbol de categorías (raíces con sus subcategorías), para la página de categorías. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      position: true,
      parentId: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  const byParent = new Map<string | null, typeof all>();
  for (const c of all) {
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }

  // El conteo de una categoría incluye los productos de sus subcategorías.
  const build = (parentId: string | null): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((c) => {
      const children = build(c.id);
      const productCount = c._count.products + children.reduce((sum, child) => sum + child.productCount, 0);
      return { id: c.id, name: c.name, slug: c.slug, position: c.position, productCount, children };
    });

  return build(null);
}

export type CategoryOption = { id: string; label: string; group: string; isRoot: boolean };

/** Opciones planas para el desplegable del formulario: "Ropa íntima › Conjuntos". */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const tree = await getCategoryTree();
  const options: CategoryOption[] = [];
  for (const root of tree) {
    if (root.children.length === 0) {
      options.push({ id: root.id, label: root.name, group: root.name, isRoot: true });
    }
    for (const child of root.children) {
      options.push({ id: child.id, label: child.name, group: root.name, isRoot: false });
    }
  }
  return options;
}

/** Ids de una categoría y de todas sus subcategorías (para filtrar productos). */
export async function getCategoryIdsWithChildren(categoryId: string) {
  const children = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } });
  return [categoryId, ...children.map((c) => c.id)];
}
