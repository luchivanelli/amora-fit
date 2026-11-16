"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fail, ok, GENERIC_ERROR, type ActionResult } from "@/lib/action-result";

export async function toggleFavorite(productId: string): Promise<ActionResult<{ favorite: boolean; needLogin?: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) return ok({ favorite: false, needLogin: true });
    if (!productId) return fail(GENERIC_ERROR);

    const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId: session.user.id, productId } } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId: session.user.id, productId } });
    }
    revalidatePath("/cuenta/favoritos");
    return ok({ favorite: !existing });
  } catch (e) {
    console.error(e);
    return fail(GENERIC_ERROR);
  }
}
