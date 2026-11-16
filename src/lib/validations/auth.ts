import { z } from "zod";

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
