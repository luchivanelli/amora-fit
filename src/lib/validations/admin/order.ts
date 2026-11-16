import { z } from "zod";

export const orderStatusSchema = z.enum([
  "PENDIENTE_ACUERDO",
  "PENDIENTE_PAGO",
  "PAGADO",
  "PREPARANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
]);

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: orderStatusSchema,
});

export const agreedShippingSchema = z.object({
  orderId: z.string().min(1),
  shippingCost: z
    .number({ invalid_type_error: "Escribí un número" })
    .min(0, "No puede ser negativo")
    .max(9_999_999, "El costo es demasiado alto")
    .nullable(),
});

export const adminNotesSchema = z.object({
  orderId: z.string().min(1),
  adminNotes: z.string().trim().max(2000, "La nota es muy larga"),
});
