"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { fail, ok, zodFieldErrors, GENERIC_ERROR, type ActionResult, type FieldErrors } from "@/lib/action-result";
import { cleanText } from "@/lib/utils";
import { addressSchema, changePasswordSchema, profileSchema, registerSchema } from "@/lib/validations/shop";

export type AccountFormState = { error?: string; fieldErrors?: FieldErrors; success?: string };

function safeCallback(v: FormDataEntryValue | null) {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/cuenta";
}

export async function registerAction(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const ip = await getClientIp();
  if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000).ok) return { error: "Demasiados intentos. Esperá unos minutos." };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const { name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return { fieldErrors: { email: "Ya hay una cuenta con ese mail. Probá ingresar." } };

  await prisma.user.create({ data: { name: cleanText(name), email, passwordHash: await bcrypt.hash(password, 12), role: "CUSTOMER" } });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return { success: "Cuenta creada. Ahora ingresá con tu mail y contraseña." };
    throw e;
  }
  redirect(safeCallback(formData.get("callbackUrl")));
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("NO_SESSION");
  return session.user;
}

export async function updateProfile(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  try {
    const user = await requireUser();
    const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? "" });
    if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
    await prisma.user.update({ where: { id: user.id }, data: { name: cleanText(parsed.data.name), phone: parsed.data.phone ? cleanText(parsed.data.phone) : null } });
    revalidatePath("/cuenta");
    return { success: "Datos guardados." };
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export async function changePassword(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  try {
    const user = await requireUser();
    const parsed = changePasswordSchema.safeParse({
      current: formData.get("current"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
    if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!row?.passwordHash || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
      return { fieldErrors: { current: "La contraseña actual no es correcta." } };
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
    return { success: "Contraseña actualizada." };
  } catch {
    return { error: GENERIC_ERROR };
  }
}

export type AddressInput = {
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  province: string;
  zip: string;
  notes?: string;
  label?: string;
  isDefault?: boolean;
};

export async function saveAddress(input: AddressInput, addressId?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = addressSchema.safeParse(input);
    if (!parsed.success) return fail("Revisá los datos marcados.", zodFieldErrors(parsed.error.issues));
    const d = parsed.data;
    const data = {
      fullName: cleanText(d.fullName),
      phone: cleanText(d.phone),
      street: cleanText(d.street),
      apartment: d.apartment ? cleanText(d.apartment) : null,
      city: cleanText(d.city),
      province: cleanText(d.province),
      zip: cleanText(d.zip),
      notes: d.notes ? cleanText(d.notes) : null,
      label: d.label ? cleanText(d.label) : "Casa",
    };

    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      const makeDefault = Boolean(d.isDefault) || count === 0;
      if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      if (addressId) {
        const owned = await tx.address.findFirst({ where: { id: addressId, userId: user.id }, select: { id: true } });
        if (!owned) throw new Error("NOT_FOUND");
        return tx.address.update({ where: { id: addressId }, data: { ...data, ...(makeDefault ? { isDefault: true } : {}) }, select: { id: true } });
      }
      return tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault }, select: { id: true } });
    });

    revalidatePath("/cuenta/direcciones");
    revalidatePath("/checkout");
    return ok(result);
  } catch (e) {
    if (e instanceof Error && e.message === "NO_SESSION") return fail("Ingresá a tu cuenta para guardar direcciones.");
    return fail(GENERIC_ERROR);
  }
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const addr = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!addr) return ok(undefined);
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: addr.id } });
      if (addr.isDefault) {
        const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    revalidatePath("/cuenta/direcciones");
    return ok(undefined);
  } catch {
    return fail(GENERIC_ERROR);
  }
}

export async function setDefaultAddress(addressId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      prisma.address.updateMany({ where: { id: addressId, userId: user.id }, data: { isDefault: true } }),
    ]);
    revalidatePath("/cuenta/direcciones");
    return ok(undefined);
  } catch {
    return fail(GENERIC_ERROR);
  }
}
