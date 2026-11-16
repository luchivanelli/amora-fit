import { z } from "zod";

export const colorSchema = z.object({
  name: z.string().trim().min(1, "Poné un nombre al color").max(30, "El nombre del color es muy largo"),
  // Uno o varios tonos separados por coma: "#ffffff" o "#ffffff,#1f1f1f" (hasta 4).
  hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}(,#[0-9a-fA-F]{6}){0,3}$/, "Color inválido")
    .nullable()
    .optional(),
});

const money = z
  .number({ invalid_type_error: "Escribí solo números" })
  .min(0, "El precio no puede ser negativo")
  .max(99_999_999, "El precio es demasiado alto");

/**
 * Lo que se guarda al autoguardar o "Guardar borrador": casi todo es opcional.
 * La clave de `stock` es `${talle}::${color}`.
 */
export const productDraftSchema = z.object({
  name: z.string().trim().max(120, "El nombre es muy largo (máximo 120 letras)"),
  description: z.string().trim().max(5000, "La descripción es muy larga"),
  categoryId: z.string().nullable(),
  price: money.nullable(),
  compareAtPrice: money.nullable(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  sizes: z.array(z.string().trim().min(1).max(12, "El talle es muy largo")).max(30, "Demasiados talles"),
  colors: z.array(colorSchema).max(30, "Demasiados colores"),
  stock: z.record(z.string(), z.number().int("Solo números enteros").min(0, "No puede ser negativo").max(100_000)),
});

export type ProductFormValues = z.infer<typeof productDraftSchema>;

/** Lo que se exige para "Publicar". Mensajes pensados para la dueña. */
export const productPublishSchema = productDraftSchema
  .extend({
    name: z.string().trim().min(2, "Falta el nombre del producto").max(120, "El nombre es muy largo"),
    description: z
      .string()
      .trim()
      .min(10, "Contá un poco más sobre el producto (al menos 10 letras)")
      .max(5000, "La descripción es muy larga"),
    categoryId: z.string({ invalid_type_error: "Elegí una categoría" }).min(1, "Elegí una categoría"),
    price: z
      .number({ invalid_type_error: "Falta agregar el precio" })
      .positive("Falta agregar el precio")
      .max(99_999_999, "El precio es demasiado alto"),
  })
  .refine((d) => d.sizes.length > 0, { path: ["sizes"], message: "Elegí al menos un talle" })
  .refine((d) => d.colors.length > 0, { path: ["colors"], message: "Elegí al menos un color" })
  .refine((d) => d.compareAtPrice === null || d.compareAtPrice > (d.price ?? 0), {
    path: ["compareAtPrice"],
    message: "El precio anterior tiene que ser mayor que el precio en oferta",
  });

export const quickPriceSchema = z.object({
  productId: z.string().min(1),
  price: z.number({ invalid_type_error: "Escribí un precio" }).positive("Escribí un precio mayor a 0").max(99_999_999),
});

export const quickStockSchema = z.object({
  productId: z.string().min(1),
  stocks: z
    .array(
      z.object({
        variantId: z.string().min(1),
        stock: z.number().int("Solo números enteros").min(0, "No puede ser negativo").max(100_000),
      }),
    )
    .min(1),
});

export const imageInputSchema = z.object({
  productId: z.string().min(1),
  url: z.string().url(),
  publicId: z.string().max(300).nullable().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
