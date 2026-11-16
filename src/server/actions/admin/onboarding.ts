"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { fail, ok, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";

export async function markOnboardingSeen(): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.user.update({ where: { id: user.id }, data: { onboardingSeenAt: new Date() } });
    revalidatePath("/admin", "layout");
    return ok(undefined);
  } catch (e) {
    if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
    return fail(GENERIC_ERROR);
  }
}

export async function resetOnboarding(): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.user.update({ where: { id: user.id }, data: { onboardingSeenAt: null } });
    revalidatePath("/admin", "layout");
    return ok(undefined);
  } catch (e) {
    if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
    return fail(GENERIC_ERROR);
  }
}
