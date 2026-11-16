"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, zodFieldErrors, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";
import { uniqueSlug } from "@/lib/slug";
import { uniqueSku } from "@/lib/sku";
import { cleanText } from "@/lib/utils";
import {
  productDraftSchema,
  productPublishSchema,
  quickPriceSchema,
  quickStockSchema,
  type ProductFormValues,
} from "@/lib/validations/admin/product";

type Tx = Prisma.TransactionClient;

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  console.error(e);
  return fail(GENERIC_ERROR);
}

/** Revalida el panel y las páginas de la tienda que muestran productos. */
function revalidateProduct(slug?: string) {
  revalidateTag(TAGS.products);
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/tienda");
  if (slug) revalidatePath(`/producto/${slug}`);
}

const slugExists = (tx: Tx, excludeId?: string) => async (slug: string) =>
  Boolean(await tx.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } }));

const skuExists = (tx: Tx) => async (sku: string) =>
  Boolean(await tx.productVariant.findUnique({ where: { sku }, select: { id: true } }));

/** "+ Agregar producto": crea un borrador vacío y lleva al formulario. */
export async function createDraftProduct() {
  await requireAdmin();

  const firstCategory = await prisma.category.findFirst({
    where: { isActive: true, parentId: { not: null } },
    orderBy: { position: "asc" },
  }) ?? (await prisma.category.findFirst({ orderBy: { position: "asc" } }));

  if (!firstCategory) {
    redirect("/admin/categorias?aviso=sin-categorias");
  }

  const product = await prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(`producto-${Date.now().toString(36)}`, slugExists(tx));
    return tx.product.create({
      data: { name: "", description: "", slug, price: 0, status: "DRAFT", categoryId: firstCategory.id },
      select: { id: true },
    });
  });

  revalidatePath("/admin/productos");
  redirect(`/admin/productos/${product.id}`);
}

/**
 * Guarda el formulario completo (producto + variantes) en una transacción.
 * mode: "autosave" | "draft" guardan lo que haya; "publish" exige el formulario completo.
 */
export async function saveProduct(
  productId: string,
  values: ProductFormValues,
  mode: "autosave" | "draft" | "publish",
): Promise<ActionResult<{ updatedAt: string; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }>> {
  try {
    await requireAdmin();

    const schema = mode === "publish" ? productPublishSchema : productDraftSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      return fail("Revisá los campos marcados.", zodFieldErrors(parsed.error.issues));
    }
    const data = parsed.data;

    const existing = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, slug: true, deletedAt: true, status: true } });
    if (!existing) return fail("Ese producto ya no existe.");
    if (existing.deletedAt) return fail("Este producto está eliminado. Restauralo para editarlo.");

    if (mode === "publish") {
      const imageCount = await prisma.productImage.count({ where: { productId } });
      if (imageCount === 0) return fail("Revisá los campos marcados.", { images: "Agregá al menos una foto" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const name = cleanText(data.name);
      const slug = name
        ? await uniqueSlug(name, slugExists(tx, productId))
        : existing.slug;

      const newStatus = mode === "publish" ? "ACTIVE" : mode === "draft" ? "DRAFT" : existing.status;

      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          slug,
          description: cleanText(data.description),
          categoryId: data.categoryId ?? undefined,
          price: data.price ?? 0,
          compareAtPrice: data.compareAtPrice,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          status: newStatus,
        },
        select: { updatedAt: true, status: true, slug: true },
      });

      await syncVariants(tx, productId, name || "producto", data);

      // Fotos asignadas a un color que ya no existe pasan a verse con todos los colores.
      await tx.productImage.updateMany({
        where: { productId, color: { not: null, notIn: data.colors.map((c) => c.name) } },
        data: { color: null },
      });
      return product;
    });

    revalidateProduct(existing.slug);
    if (result.slug !== existing.slug) revalidatePath(`/producto/${result.slug}`);

    return ok({ updatedAt: result.updatedAt.toISOString(), status: result.status });
  } catch (e) {
    return handleError(e);
  }
}

/** Crea, actualiza y elimina variantes para que coincidan con la grilla talle × color. */
async function syncVariants(tx: Tx, productId: string, productName: string, data: ProductFormValues) {
  const existing = await tx.productVariant.findMany({ where: { productId } });
  const key = (size: string, color: string) => `${size}::${color}`;

  const desired = new Map<string, { size: string; color: string; hex: string | null; stock: number }>();
  for (const size of data.sizes) {
    for (const color of data.colors) {
      desired.set(key(size, color.name), {
        size,
        color: color.name,
        hex: color.hex ?? null,
        stock: data.stock[key(size, color.name)] ?? 0,
      });
    }
  }

  const toDelete = existing.filter((v) => !desired.has(key(v.size, v.color)));
  if (toDelete.length) {
    await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
  }

  for (const [k, d] of desired) {
    const current = existing.find((v) => key(v.size, v.color) === k);
    if (current) {
      if (current.stock !== d.stock || current.colorHex !== d.hex || !current.isActive) {
        await tx.productVariant.update({
          where: { id: current.id },
          data: { stock: d.stock, colorHex: d.hex, isActive: true },
        });
        if (current.stock !== d.stock) {
          await tx.stockMovement.create({
            data: { variantId: current.id, delta: d.stock - current.stock, reason: "ADMIN_ADJUSTMENT" },
          });
        }
      }
    } else {
      const sku = await uniqueSku(productName, d.size, d.color, skuExists(tx));
      const created = await tx.productVariant.create({
        data: { productId, size: d.size, color: d.color, colorHex: d.hex, sku, stock: d.stock },
      });
      if (d.stock > 0) {
        await tx.stockMovement.create({ data: { variantId: created.id, delta: d.stock, reason: "INITIAL" } });
      }
    }
  }
}

/** Ocultar / Mostrar en la tienda (sin pasar por el formulario). */
export async function setProductVisibility(productId: string, visible: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, deletedAt: true, name: true, categoryId: true, price: true } });
    if (!p || p.deletedAt) return fail("Ese producto ya no está disponible.");
    if (visible) {
      const [imageCount, variantCount] = await Promise.all([
        prisma.productImage.count({ where: { productId } }),
        prisma.productVariant.count({ where: { productId } }),
      ]);
      if (!p.name || Number(p.price) <= 0 || imageCount === 0 || variantCount === 0) {
        return fail("Para mostrarlo en la tienda le faltan datos. Abrilo con “Editar” y tocá “Publicar”.");
      }
    }
    await prisma.product.update({ where: { id: productId }, data: { status: visible ? "ACTIVE" : "DRAFT" } });
    revalidateProduct(p.slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** Marca o desmarca un producto como destacado (sección "Productos destacados" de la portada). */
export async function setProductFeatured(productId: string, featured: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, deletedAt: true } });
    if (!p || p.deletedAt) return fail("Ese producto ya no está disponible.");
    await prisma.product.update({ where: { id: productId }, data: { isFeatured: featured } });
    revalidateProduct(p.slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** "Eliminar" para la dueña = archivar. Nunca se borra el historial de ventas. */
export async function archiveProduct(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    if (!p) return fail("Ese producto ya no existe.");
    await prisma.$transaction([
      prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date(), status: "ARCHIVED" } }),
      prisma.cartItem.deleteMany({ where: { variant: { productId } } }),
    ]);
    revalidateProduct(p.slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function restoreProduct(productId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    if (!p) return fail("Ese producto ya no existe.");
    await prisma.product.update({ where: { id: productId }, data: { deletedAt: null, status: "DRAFT" } });
    revalidateProduct(p.slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** Duplicar: copia todo como borrador, con stock en 0 y nombre "(copia)". */
export async function duplicateProduct(productId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const source = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
    });
    if (!source) return fail("Ese producto ya no existe.");

    const copy = await prisma.$transaction(async (tx) => {
      const name = source.name ? `${source.name} (copia)` : "";
      const slug = await uniqueSlug(name || `producto-${Date.now().toString(36)}`, slugExists(tx));
      const created = await tx.product.create({
        data: {
          name,
          slug,
          description: source.description,
          shortDesc: source.shortDesc,
          categoryId: source.categoryId,
          status: "DRAFT",
          price: source.price,
          compareAtPrice: source.compareAtPrice,
          isFeatured: false,
          isNew: source.isNew,
          sizeGuide: source.sizeGuide,
          material: source.material,
          care: source.care,
          images: {
            create: source.images.map((img) => ({
              url: img.url,
              publicId: null, // la copia no es dueña del archivo en Cloudinary
              alt: img.alt,
              position: img.position,
              isMain: img.isMain,
            })),
          },
        },
        select: { id: true },
      });
      for (const v of source.variants) {
        const sku = await uniqueSku(name || "producto", v.size, v.color, skuExists(tx));
        await tx.productVariant.create({
          data: { productId: created.id, size: v.size, color: v.color, colorHex: v.colorHex, sku, stock: 0 },
        });
      }
      return created;
    });

    revalidatePath("/admin/productos");
    return ok({ id: copy.id });
  } catch (e) {
    return handleError(e);
  }
}

/** Edición rápida de precio desde el listado. */
export async function quickUpdatePrice(input: { productId: string; price: number }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = quickPriceSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Escribí un precio válido.");
    const p = await prisma.product.update({
      where: { id: parsed.data.productId },
      data: { price: parsed.data.price },
      select: { slug: true },
    });
    revalidateProduct(p.slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** Edición rápida de stock por variante desde el listado. */
export async function quickUpdateStock(input: { productId: string; stocks: { variantId: string; stock: number }[] }): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = quickStockSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Revisá las cantidades.");

    const slug = await prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { productId: parsed.data.productId, id: { in: parsed.data.stocks.map((s) => s.variantId) } },
        select: { id: true, stock: true, product: { select: { slug: true } } },
      });
      for (const s of parsed.data.stocks) {
        const v = variants.find((x) => x.id === s.variantId);
        if (!v || v.stock === s.stock) continue;
        await tx.productVariant.update({ where: { id: v.id }, data: { stock: s.stock } });
        await tx.stockMovement.create({ data: { variantId: v.id, delta: s.stock - v.stock, reason: "ADMIN_ADJUSTMENT" } });
      }
      return variants[0]?.product.slug;
    });

    revalidateProduct(slug);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
