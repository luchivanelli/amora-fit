"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { parseHexes, joinHexes, MAX_TONES_PER_COLOR } from "@/lib/colors";
import { fail, ok, GENERIC_ERROR, NO_PERMISSION_ERROR, type ActionResult } from "@/lib/action-result";

export type SavedColorDTO = { id: string; name: string; hex: string };

function handleError<T>(e: unknown): ActionResult<T> {
  if (e instanceof Error && e.name === "NotAdminError") return fail(NO_PERMISSION_ERROR);
  console.error(e);
  return fail(GENERIC_ERROR);
}

const colorSchema = z.object({
  name: z.string().trim().min(1).max(30),
  hex: z.string().refine((h) => {
    const n = parseHexes(h).length;
    return n >= 1 && n <= MAX_TONES_PER_COLOR;
  }),
});

export async function listSavedColors(): Promise<ActionResult<SavedColorDTO[]>> {
  try {
    await requireAdmin();
    const rows = await prisma.savedColor.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, name: true, hex: true } });
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

/** Guarda (o actualiza los tonos de) un color con nombre. Se llama al agregar un color a un producto. */
export async function saveColor(input: { name: string; hex: string }): Promise<ActionResult<SavedColorDTO>> {
  try {
    await requireAdmin();
    const parsed = colorSchema.safeParse(input);
    if (!parsed.success) return fail("Ese color no es válido.");
    const name = parsed.data.name;
    const hex = joinHexes(parseHexes(parsed.data.hex));
    const row = await prisma.savedColor.upsert({
      where: { nameKey: name.toLowerCase() },
      create: { name, nameKey: name.toLowerCase(), hex },
      update: { name, hex },
      select: { id: true, name: true, hex: true },
    });
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}

/** Quita un color de la lista de guardados. No toca los productos que ya lo usan. */
export async function deleteSavedColor(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.savedColor.delete({ where: { id } });
    return ok(undefined);
  } catch (e) {
    return handleError(e);
  }
}
