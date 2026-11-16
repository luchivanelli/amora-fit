import { formatMoney, orderNumber } from "@/lib/utils";

/** Normaliza un teléfono argentino a formato internacional para wa.me. */
export function toWaNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) return digits.startsWith("549") ? digits : `549${digits.slice(2)}`;
  if (digits.startsWith("0")) digits = digits.slice(1);
  // "11 15 1234 5678" -> quitar el 15 después del código de área
  digits = digits.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
  return `549${digits}`;
}

export function waLink(phone: string, message: string) {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;
}

type OrderForMessage = {
  number: number;
  contactName: string;
  total: number;
  shippingCost: number | null;
  items: { productName: string; variantLabel: string; quantity: number }[];
};

/** Mensaje que la vendedora le manda al cliente desde el panel. */
export function sellerToCustomerMessage(order: OrderForMessage) {
  const firstName = order.contactName.split(" ")[0] || order.contactName;
  const lines = order.items.map((i) => `• ${i.quantity} × ${i.productName} (${i.variantLabel})`);
  const shipping =
    order.shippingCost === null
      ? "Te escribo para coordinar el envío y el pago."
      : `Envío: ${formatMoney(order.shippingCost)}.`;
  return [
    `¡Hola ${firstName}! Soy de AMORA 🌿`,
    `Te escribo por tu pedido ${orderNumber(order.number)}:`,
    ...lines,
    `Total: ${formatMoney(order.total)}`,
    shipping,
  ].join("\n");
}
