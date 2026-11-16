import { z } from "zod";
import { SECURITY_QUESTION_KEYS } from "@/lib/security-questions";

export const securityQuestionField = z.enum(SECURITY_QUESTION_KEYS, { errorMap: () => ({ message: "Elegí una pregunta" }) });
export const securityAnswerField = z.string().trim().min(2, "Escribí una respuesta (al menos 2 letras)").max(100, "La respuesta es muy larga");

/** Paso 1 de "Olvidé mi contraseña": buscar la pregunta de la cuenta. */
export const recoveryStartSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
});

/** Paso 2: responder y elegir la nueva contraseña. */
export const recoveryResetSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
    answer: z.string().trim().min(1, "Escribí tu respuesta").max(100),
    password: z.string().min(8, "La contraseña tiene que tener al menos 8 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

/** Configurar o cambiar la pregunta desde "Mis datos" (pide la contraseña actual). */
export const setSecurityQuestionSchema = z.object({
  current: z.string().min(1, "Escribí tu contraseña actual"),
  question: securityQuestionField,
  answer: securityAnswerField,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
  password: z.string().min(1, "Escribí tu contraseña").max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "La contraseña tiene que tener al menos 8 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });
