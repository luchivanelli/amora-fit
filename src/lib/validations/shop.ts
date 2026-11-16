import { z } from "zod";
import { MAX_QTY_PER_LINE } from "@/lib/cart-cookie";
import { securityAnswerField, securityQuestionField } from "@/lib/validations/auth";

const phone = z
  .string()
  .trim()
  .min(6, "Escribí un teléfono válido")
  .max(30, "El teléfono es muy largo")
  .regex(/^[\d\s()+-]+$/, "Escribí solo números");

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(MAX_QTY_PER_LINE),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Escribí el nombre completo").max(80),
  phone,
  street: z.string().trim().min(3, "Escribí calle y número").max(120),
  apartment: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Escribí la ciudad").max(80),
  province: z.string().trim().min(2, "Elegí la provincia").max(80),
  zip: z.string().trim().min(3, "Escribí el código postal").max(12),
  notes: z.string().trim().max(200).optional().or(z.literal("")),
  label: z.string().trim().max(30).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const checkoutSchema = z
  .object({
    paymentMethod: z.enum(["MERCADO_PAGO", "ACORDAR_CON_VENDEDOR"], { errorMap: () => ({ message: "Elegí cómo querés pagar" }) }),
    contactName: z.string().trim().min(2, "Escribí tu nombre").max(80, "El nombre es muy largo"),
    contactPhone: phone,
    contactEmail: z.string().trim().toLowerCase().email("Escribí un mail válido"),
    deliveryMode: z.enum(["address", "zone"]),
    street: z.string().trim().max(120).optional().or(z.literal("")),
    apartment: z.string().trim().max(40).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    province: z.string().trim().max(80).optional().or(z.literal("")),
    zip: z.string().trim().max(12).optional().or(z.literal("")),
    zone: z.string().trim().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(1000, "Las observaciones son muy largas").optional().or(z.literal("")),
    couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal("")),
    saveAddress: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.deliveryMode === "address") {
      if (!d.street || d.street.length < 3) ctx.addIssue({ code: "custom", path: ["street"], message: "Escribí calle y número" });
      if (!d.city || d.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Escribí la ciudad" });
      if (!d.province || d.province.length < 2) ctx.addIssue({ code: "custom", path: ["province"], message: "Elegí la provincia" });
      if (!d.zip || d.zip.length < 3) ctx.addIssue({ code: "custom", path: ["zip"], message: "Escribí el código postal" });
    } else if (!d.zone || d.zone.length < 3) {
      ctx.addIssue({ code: "custom", path: ["zone"], message: "Contanos tu zona o barrio" });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const couponCodeSchema = z.string().trim().toUpperCase().min(2, "Escribí el código").max(30);

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Escribí tu nombre").max(80),
    email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
    password: z.string().min(8, "La contraseña tiene que tener al menos 8 caracteres").max(200),
    confirm: z.string(),
    securityQuestion: securityQuestionField,
    securityAnswer: securityAnswerField,
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Escribí tu nombre").max(80),
  phone: phone.optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Escribí tu contraseña actual"),
    password: z.string().min(8, "La nueva contraseña tiene que tener al menos 8 caracteres").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden" });

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribí tu nombre").max(80),
  email: z.string().trim().toLowerCase().email("Escribí un mail válido"),
  message: z.string().trim().min(10, "Contanos un poco más (al menos 10 letras)").max(2000, "El mensaje es muy largo"),
});

export const PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];
