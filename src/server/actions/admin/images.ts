"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";
import { imageInputSchema } from "@/lib/validations/admin/product";
import { createUploadSignature, destroyImage, isAllowedImageUrl, isCloudinaryConfigured } from "@/server/services/cloudinary";

const MAX_IMAGES = 10;

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  console.error(e);
  return fail(GENERIC_ERROR);
}

async function revalidateFor(productId: string) {
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidateTag(TAGS.products);
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${productId}`);
  if (p) revalidatePath(`/producto/${p.slug}`);
}

export type UploadSignature = ReturnType<typeof createUploadSignature>;

/** Firma de subida directa a Cloudinary (válida 1 hora). */
export async function getUploadSignature(productId: string): Promise<ActionResult<UploadSignature>> {
  try {
    await requireAdmin();
    if (!isCloudinaryConfigured()) {
      return fail("La subida de fotos todavía no está configurada. Pedile a quien instaló la tienda que cargue las claves de Cloudinary.");
    }
    const count = await prisma.productImage.count({ where: { productId } });
    if (count >= MAX_IMAGES) return fail(`Podés subir hasta ${MAX_IMAGES} fotos por producto.`);
    return ok(createUploadSignature(productId));
  } catch (e) {
    return handleError(e);
  }
}

export type ImageDTO = { id: string; url: string; isMain: boolean; position: number; color: string | null };

/** Registra la foto ya subida a Cloudinary. */
export async function addProductImage(input: {
  productId: string;
  url: string;
  publicId?: string | null;
}): Promise<ActionResult<ImageDTO>> {
  try {
    await requireAdmin();
    const parsed = imageInputSchema.safeParse(input);
    if (!parsed.success || !isAllowedImageUrl(parsed.data.url)) return fail("No se pudo guardar la foto. Probá de nuevo.");

    const { productId, url, publicId } = parsed.data;
    const image = await prisma.$transaction(async (tx) => {
      const [count, hasMain] = await Promise.all([
        tx.productImage.count({ where: { productId } }),
        tx.productImage.findFirst({ where: { productId, isMain: true }, select: { id: true } }),
      ]);
      if (count >= MAX_IMAGES) throw new Error("LIMIT");
      return tx.productImage.create({
        data: { productId, url, publicId: publicId ?? null, position: count, isMain: !hasMain },
      });
    });

    await revalidateFor(productId);
    return ok({ id: image.id, url: image.url, isMain: image.isMain, position: image.position, color: image.color });
  } catch (e) {
    if (e instanceof Error && e.message === "LIMIT") return fail(`Podés subir hasta ${MAX_IMAGES} fotos por producto.`);
    return handleError(e);
  }
}

/** A qué color del producto pertenece la foto (null => se muestra con todos). */
export async function setProductImageColor(productId: string, imageId: string, color: string | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const clean = color?.trim().slice(0, 30) || null;
    await prisma.productImage.updateMany({ where: { id: imageId, productId }, data: { color: clean } });
    await revalidateFor(productId);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function reorderProductImages(productId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) return fail(GENERIC_ERROR);
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.productImage.updateMany({ where: { id, productId }, data: { position: index } }),
      ),
    );
    await revalidateFor(productId);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function setMainProductImage(productId: string, imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId }, data: { isMain: false } }),
      prisma.productImage.updateMany({ where: { id: imageId, productId }, data: { isMain: true } }),
    ]);
    await revalidateFor(productId);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteProductImage(productId: string, imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) return ok(undefined);

    await prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: imageId } });
      const rest = await tx.productImage.findMany({ where: { productId }, orderBy: { position: "asc" } });
      for (let i = 0; i < rest.length; i++) {
        await tx.productImage.update({
          where: { id: rest[i].id },
          data: { position: i, isMain: image.isMain ? i === 0 : rest[i].isMain },
        });
      }
    });

    if (image.publicId) await destroyImage(image.publicId);
    await revalidateFor(productId);
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
