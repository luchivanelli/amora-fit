import type { OrderStatus, PaymentMethod, ProductStatus } from "@prisma/client";

/** Traducción de valores técnicos a texto para la dueña del negocio. */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE_ACUERDO: "Pendiente (a acordar)",
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pagado",
  PREPARANDO: "Preparando",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "PENDIENTE_ACUERDO",
  "PENDIENTE_PAGO",
  "PAGADO",
  "PREPARANDO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

export const ORDER_STATUS_TONE: Record<OrderStatus, "neutral" | "warning" | "success" | "info" | "danger"> = {
  PENDIENTE_ACUERDO: "warning",
  PENDIENTE_PAGO: "warning",
  PAGADO: "success",
  PREPARANDO: "info",
  ENVIADO: "info",
  ENTREGADO: "success",
  CANCELADO: "danger",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  MERCADO_PAGO: "Mercado Pago",
  ACORDAR_CON_VENDEDOR: "Acordar con la vendedora",
};

export type ProductDisplayStatus = "publicado" | "borrador" | "sin-stock" | "archivado";

export const PRODUCT_DISPLAY_LABELS: Record<ProductDisplayStatus, string> = {
  publicado: "Publicado",
  borrador: "Borrador",
  "sin-stock": "Sin stock",
  archivado: "Eliminado",
};

export function getProductDisplayStatus(p: {
  status: ProductStatus;
  deletedAt: Date | string | null;
  totalStock: number;
}): ProductDisplayStatus {
  if (p.deletedAt) return "archivado";
  if (p.status !== "ACTIVE") return "borrador";
  if (p.totalStock <= 0) return "sin-stock";
  return "publicado";
}

export { LOW_STOCK_THRESHOLD } from "@/lib/stock";

export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const DEFAULT_NUMERIC_SIZES = ["80", "85", "90", "95", "100"];

export const DEFAULT_COLORS: { name: string; hex: string }[] = [
  { name: "Oliva", hex: "#767c4e" },
  { name: "Crema", hex: "#f3ecdc" },
  { name: "Negro", hex: "#1f1f1f" },
  { name: "Blanco", hex: "#ffffff" },
  { name: "Arena", hex: "#d9c7a7" },
  { name: "Rosa", hex: "#e8b4b8" },
  { name: "Terracota", hex: "#b5634a" },
  { name: "Gris", hex: "#9a9a9a" },
  { name: "Azul", hex: "#3f4f6b" },
  { name: "Bordó", hex: "#6d2434" },
];
