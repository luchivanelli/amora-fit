"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { zodFieldErrors, type FieldErrors } from "@/lib/action-result";
import { forgotPasswordSchema, loginSchema, recoveryResetSchema, recoveryStartSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { normalizeSecurityAnswer, securityQuestionLabel } from "@/lib/security-questions";
import { passwordResetEmail, sendEmail } from "@/server/services/email";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
};

function safeCallback(url: FormDataEntryValue | null) {
  const v = typeof url === "string" ? url : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getClientIp();
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return { error: `Demasiados intentos. Esperá ${Math.ceil(limit.retryAfterSec / 60)} minutos y probá de nuevo.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "El mail o la contraseña no son correctos." };
    }
    throw err;
  }

  // La dueña va al panel; las clientas, a su cuenta (o a donde estaban, ej. el checkout).
  const callback = safeCallback(formData.get("callbackUrl"));
  if (callback) redirect(callback);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { role: true } });
  redirect(user?.role === "ADMIN" ? "/admin" : "/cuenta");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/ingresar" });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getClientIp();
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000).ok) {
    return { error: "Demasiados pedidos. Esperá unos minutos y probá de nuevo." };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };

  // Siempre respondemos lo mismo: no revelamos si el mail existe.
  const successMessage = "Si ese mail está registrado, te enviamos un link para elegir una nueva contraseña.";

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const link = `${base}/restablecer/${token}`;
    const mail = passwordResetEmail(link);
    await sendEmail({ to: user.email, ...mail });
  }

  return { success: successMessage };
}

/* ───────── Recuperar contraseña con pregunta de seguridad (sin mail) ───────── */

export type RecoveryState = {
  step: "email" | "question";
  email?: string;
  question?: string;
  error?: string;
  fieldErrors?: FieldErrors;
};

const RECOVERY_MAX_ATTEMPTS = 5;
const RECOVERY_LOCK_MS = 30 * 60 * 1000;
// Mismo mensaje si el mail no existe o no tiene pregunta: no revelamos qué cuentas hay.
const RECOVERY_UNAVAILABLE =
  "No podemos recuperar esa cuenta desde acá. Escribinos por WhatsApp y te ayudamos.";
const RECOVERY_LOCKED = "Hubo demasiados intentos con esa cuenta. Esperá 30 minutos o escribinos por WhatsApp.";

export async function recoveryStartAction(_prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const ip = await getClientIp();
  if (!rateLimit(`recovery-start:${ip}`, 10, 15 * 60 * 1000).ok) {
    return { step: "email", error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
  }
  const parsed = recoveryStartSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { step: "email", fieldErrors: zodFieldErrors(parsed.error.issues) };
  const email = parsed.data.email;

  const user = await prisma.user.findUnique({ where: { email }, select: { securityQuestion: true, securityAnswerHash: true, securityLockedUntil: true } });
  const question = securityQuestionLabel(user?.securityQuestion);
  if (!user || !question || !user.securityAnswerHash) return { step: "email", email, error: RECOVERY_UNAVAILABLE };
  if (user.securityLockedUntil && user.securityLockedUntil > new Date()) return { step: "email", email, error: RECOVERY_LOCKED };

  return { step: "question", email, question };
}

export async function recoveryResetAction(prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const ip = await getClientIp();
  if (!rateLimit(`recovery-reset:${ip}`, 10, 15 * 60 * 1000).ok) {
    return { ...prev, error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
  }
  const parsed = recoveryResetSchema.safeParse({
    email: formData.get("email"),
    answer: formData.get("answer"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { ...prev, error: undefined, fieldErrors: zodFieldErrors(parsed.error.issues) };
  const { email, answer, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, securityAnswerHash: true, securityFailedAttempts: true, securityLockedUntil: true },
  });
  if (!user?.securityAnswerHash) return { step: "email", email, error: RECOVERY_UNAVAILABLE };
  if (user.securityLockedUntil && user.securityLockedUntil > new Date()) return { step: "email", email, error: RECOVERY_LOCKED };

  const okAnswer = await bcrypt.compare(normalizeSecurityAnswer(answer), user.securityAnswerHash);
  if (!okAnswer) {
    // Bloqueo por cuenta (no solo por IP): en Vercel el contador de IP vive por instancia.
    const attempts = user.securityFailedAttempts + 1;
    const lock = attempts >= RECOVERY_MAX_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: lock ? { securityFailedAttempts: 0, securityLockedUntil: new Date(Date.now() + RECOVERY_LOCK_MS) } : { securityFailedAttempts: attempts },
    });
    if (lock) return { step: "email", email, error: RECOVERY_LOCKED };
    const left = RECOVERY_MAX_ATTEMPTS - attempts;
    return { ...prev, fieldErrors: { answer: `La respuesta no coincide. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.` }, error: undefined };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), securityFailedAttempts: 0, securityLockedUntil: null },
  });
  redirect("/ingresar?reset=ok");
}

/** Un solo action para el formulario de dos pasos: `intent` = "start" | "reset" | "back". */
export async function recoveryAction(prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const intent = formData.get("intent");
  if (intent === "back") return { step: "email", email: prev.email };
  if (intent === "reset") return recoveryResetAction(prev, formData);
  return recoveryStartAction(prev, formData);
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getClientIp();
  if (!rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000).ok) {
    return { error: "Demasiados intentos. Esperá unos minutos y probá de nuevo." };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };

  const record = await prisma.passwordResetToken.findUnique({ where: { token: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "El link ya no es válido. Pedí uno nuevo desde “Olvidé mi contraseña”." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { email: record.email }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { email: record.email, id: { not: record.id } } }),
  ]);

  redirect("/ingresar?reset=ok");
}
