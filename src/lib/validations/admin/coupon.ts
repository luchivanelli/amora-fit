import { z } from "zod";

const optionalDate = z
  .string()
  .datetime({ message: "Fecha inválida" })
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

export const couponSchema = z
  .object({
    id: z.string().min(1).nullable(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "El código tiene que tener al menos 3 caracteres")
      .max(30, "El código es muy largo")
      .regex(/^[A-Z0-9_-]+$/, "Usá solo letras, números, guion o guion bajo (sin espacios)"),
    description: z.string().trim().max(120, "La descripción es muy larga").nullable(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number({ invalid_type_error: "Ingresá el valor del descuento" }).positive("El descuento tiene que ser mayor a 0"),
    minSubtotal: z.number().positive("El mínimo tiene que ser mayor a 0").nullable(),
    maxUses: z.number().int("Tiene que ser un número entero").positive("Tiene que ser mayor a 0").nullable(),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENTAGE" && d.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "El porcentaje no puede ser mayor a 100" });
    }
    if (d.startsAt && d.expiresAt && d.expiresAt < d.startsAt) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "El vencimiento tiene que ser después del inicio" });
    }
  });

export type CouponInput = z.input<typeof couponSchema>;
