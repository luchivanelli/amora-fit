"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";
import { uniqueSlug } from "@/lib/slug";
import { createCategorySchema, renameCategorySchema, reorderCategoriesSchema } from "@/lib/validations/admin/category";

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  console.error(e);
  return fail(GENERIC_ERROR);
}

function revalidateCategories() {
  revalidateTag(TAGS.categories);
  revalidateTag(TAGS.products);
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
}

export async function createCategory(input: { name: string; parentId: string | null }): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá el nombre.");
    const { name, parentId } = parsed.data;

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
      if (!parent) return fail("La categoría principal ya no existe.");
      if (parent.parentId) return fail("Solo se pueden crear subcategorías dentro de una categoría principal.");
    }

    const created = await prisma.$transaction(async (tx) => {
      const slug = await uniqueSlug(name, async (s) => Boolean(await tx.category.findUnique({ where: { slug: s }, select: { id: true } })));
      const last = await tx.category.findFirst({ where: { parentId }, orderBy: { position: "desc" }, select: { position: true } });
      return tx.category.create({
        data: { name, slug, parentId, position: (last?.position ?? -1) + 1 },
        select: { id: true },
      });
    });

    revalidateCategories();
    return ok({ id: created.id });
  } catch (e) {
    return handleError(e);
  }
}

export async function renameCategory(input: { id: string; name: string }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = renameCategorySchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá el nombre.");
    await prisma.category.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name } });
    revalidateCategories();
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function reorderCategories(input: { parentId: string | null; orderedIds: string[] }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = reorderCategoriesSchema.safeParse(input);
    if (!parsed.success) return fail(GENERIC_ERROR);
    await prisma.$transaction(
      parsed.data.orderedIds.map((id, index) =>
        prisma.category.updateMany({ where: { id, parentId: parsed.data.parentId }, data: { position: index } }),
      ),
    );
    revalidateCategories();
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const cat = await prisma.category.findUnique({
      where: { id },
      select: { _count: { select: { products: true, children: true } } },
    });
    if (!cat) return ok(undefined);
    if (cat._count.children > 0) return fail("Primero eliminá o mové sus subcategorías.");
    if (cat._count.products > 0) {
      return fail(`Esta categoría tiene ${cat._count.products} ${cat._count.products === 1 ? "producto" : "productos"}. Cambiales la categoría antes de eliminarla.`);
    }
    await prisma.category.delete({ where: { id } });
    revalidateCategories();
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
