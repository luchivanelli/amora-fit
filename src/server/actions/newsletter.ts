"use server";

import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { zodFieldErrors, type FieldErrors } from "@/lib/action-result";
import { cleanText } from "@/lib/utils";
import { contactSchema, newsletterSchema } from "@/lib/validations/shop";
import { sendEmail } from "@/server/services/email";

export type SimpleFormState = { error?: string; fieldErrors?: FieldErrors; success?: string };

export async function subscribeNewsletter(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ip = await getClientIp();
  if (!rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000).ok) return { error: "Probá de nuevo en unos minutos." };

  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });
    return { success: "¡Listo! Te vas a enterar primero de los nuevos ingresos." };
  } catch {
    return { error: "No pudimos anotarte. Probá de nuevo." };
  }
}

export async function sendContactMessage(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ip = await getClientIp();
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000).ok) return { error: "Probá de nuevo en unos minutos." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };

  const to = process.env.SELLER_EMAIL;
  if (!to) return { error: "El formulario de contacto no está disponible. Escribinos por WhatsApp." };

  const { name, email, message } = parsed.data;
  const safeMessage = cleanText(message);
  const res = await sendEmail({
    to,
    subject: `Consulta desde la tienda · ${cleanText(name)}`,
    text: `De: ${cleanText(name)} <${email}>\n\n${safeMessage}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#2b2a26"><p><strong>${cleanText(name)}</strong> · ${email}</p><p style="white-space:pre-line">${safeMessage.replace(/</g, "&lt;")}</p></div>`,
  });
  if (!res.ok) return { error: "No pudimos enviar el mensaje. Probá por WhatsApp." };
  return { success: "¡Gracias! Te respondemos a la brevedad." };
}
