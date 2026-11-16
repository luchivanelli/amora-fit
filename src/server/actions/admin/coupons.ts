"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, zodFieldErrors, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";
import { couponSchema, type CouponInput } from "@/lib/validations/admin/coupon";

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return fail("Ya existe un cupón con ese código.", { code: "Ya existe un cupón con ese código" });
  }
  console.error(e);
  return fail(GENERIC_ERROR);
}

/** Crea (id = null) o edita un cupón. */
export async function saveCoupon(input: CouponInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const parsed = couponSchema.safeParse(input);
    if (!parsed.success) return fail("Revisá los campos marcados.", zodFieldErrors(parsed.error.issues));
    const { id, ...data } = parsed.data;

    const saved = id
      ? await prisma.coupon.update({ where: { id }, data, select: { id: true } })
      : await prisma.coupon.create({ data, select: { id: true } });

    revalidatePath("/admin/cupones");
    return ok({ id: saved.id });
  } catch (e) {
    return handleError(e);
  }
}

export async function setCouponActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.coupon.update({ where: { id }, data: { isActive } });
    revalidatePath("/admin/cupones");
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}

/** Los pedidos guardan una copia del código, así que borrar el cupón no altera el historial. */
export async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/admin/cupones");
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
