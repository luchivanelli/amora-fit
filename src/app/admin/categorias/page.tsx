import type { Metadata } from "next";
import { getCategoryTree } from "@/server/queries/admin/categories";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryManager } from "@/components/admin/categories/category-manager";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const [tree, params] = await Promise.all([getCategoryTree(), searchParams]);

  return (
    <div>
      <PageHeader
        title="Categorías"
        subtitle="Así se ordena tu tienda. Arrastrá para cambiar el orden, tocá el lápiz para renombrar."
      />
      {params.aviso === "sin-categorias" && (
        <p role="status" className="mb-5 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-[15px] text-warn">
          Para cargar productos primero necesitás al menos una categoría. Creá una acá abajo y volvé a “Agregar producto”.
        </p>
      )}
      <CategoryManager tree={tree} />
    </div>
  );
}
