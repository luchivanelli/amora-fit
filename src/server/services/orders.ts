import { prisma } from "@/lib/prisma";
import { formatMoney, orderNumber } from "@/lib/utils";
import { sendEmail } from "@/server/services/email";
import { releaseOrderStock } from "@/server/services/stock";

/**
 * Cancela pedidos de Mercado Pago que vencieron sin pago y devuelve su stock.
 * Se llama de forma oportunista (al iniciar un checkout y desde el webhook).
 */
export async function expireStaleOrders() {
  const stale = await prisma.order.findMany({
    where: { status: "PENDIENTE_PAGO", expiresAt: { lt: new Date() }, stockReserved: true },
    select: { id: true },
    take: 50,
  });
  for (const { id } of stale) {
    await prisma.$transaction(async (tx) => {
      await releaseOrderStock(tx, id);
      await tx.order.update({ where: { id }, data: { status: "CANCELADO", cancelledAt: new Date() } });
    });
  }
  return stale.length;
}

type OrderForEmail = {
  id: string;
  number: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  paymentMethod: "MERCADO_PAGO" | "ACORDAR_CON_VENDEDOR";
  subtotal: number;
  discount: number;
  shippingCost: number | null;
  total: number;
  notes: string | null;
  deliveryText: string;
  items: { productName: string; variantLabel: string; quantity: number; lineTotal: number }[];
};

function itemsHtml(o: OrderForEmail) {
  return o.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity} × ${i.productName}<br><span style="color:#6b685f;font-size:13px">${i.variantLabel}</span></td><td style="padding:6px 0;text-align:right">${formatMoney(i.lineTotal)}</td></tr>`,
    )
    .join("");
}

function itemsText(o: OrderForEmail) {
  return o.items.map((i) => `• ${i.quantity} × ${i.productName} (${i.variantLabel}) — ${formatMoney(i.lineTotal)}`).join("\n");
}

function totalsHtml(o: OrderForEmail) {
  const shipping = o.shippingCost === null ? "A coordinar" : formatMoney(o.shippingCost);
  return `
    <tr><td style="padding-top:12px;border-top:1px solid #e2dacc">Subtotal</td><td style="padding-top:12px;border-top:1px solid #e2dacc;text-align:right">${formatMoney(o.subtotal)}</td></tr>
    ${o.discount > 0 ? `<tr><td>Descuento</td><td style="text-align:right">-${formatMoney(o.discount)}</td></tr>` : ""}
    <tr><td>Envío</td><td style="text-align:right">${shipping}</td></tr>
    <tr><td style="font-weight:bold;font-size:17px;padding-top:8px">Total</td><td style="font-weight:bold;font-size:17px;text-align:right;padding-top:8px">${formatMoney(o.total)}</td></tr>`;
}

function wrap(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#2b2a26;font-size:15px;line-height:1.5">
    <p style="font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#767c4e;margin:0 0 16px">AMORA</p>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${body}</div>`;
}

/** Aviso a la vendedora de un pedido nuevo. */
export async function notifySellerNewOrder(o: OrderForEmail) {
  const to = process.env.SELLER_EMAIL;
  if (!to) return;
  const num = orderNumber(o.number);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const method = o.paymentMethod === "MERCADO_PAGO" ? "Mercado Pago" : "Acordar con la vendedora";
  await sendEmail({
    to,
    subject: `Nuevo pedido ${num} · ${o.contactName} · ${formatMoney(o.total)}`,
    text: `Nuevo pedido ${num}\nCliente: ${o.contactName} · ${o.contactPhone} · ${o.contactEmail}\nPago: ${method}\nEntrega: ${o.deliveryText}\n${o.notes ? `Observaciones: ${o.notes}\n` : ""}\n${itemsText(o)}\nTotal: ${formatMoney(o.total)}\n\nVer en el panel: ${base}/admin/pedidos/${o.id}`,
    html: wrap(
      `Nuevo pedido ${num}`,
      `<p><strong>${o.contactName}</strong><br>${o.contactPhone} · ${o.contactEmail}</p>
       <p>Pago: <strong>${method}</strong><br>Entrega: ${o.deliveryText}</p>
       ${o.notes ? `<p style="background:#faf8f3;padding:10px 12px;border-radius:10px">Observaciones: ${o.notes}</p>` : ""}
       <table style="width:100%;border-collapse:collapse">${itemsHtml(o)}${totalsHtml(o)}</table>
       <p style="margin-top:20px"><a href="${base}/admin/pedidos/${o.id}" style="background:#767c4e;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Ver pedido en el panel</a></p>`,
    ),
  });
}

/** Confirmación al cliente. */
export async function notifyCustomerOrder(o: OrderForEmail) {
  const num = orderNumber(o.number);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const agreed = o.paymentMethod === "ACORDAR_CON_VENDEDOR";
  const intro = agreed
    ? "Recibimos tu pedido. En breve nos ponemos en contacto para coordinar el pago y la entrega. Si querés, escribinos vos por WhatsApp desde la página de confirmación."
    : "Recibimos tu pedido y el pago está en proceso. Te avisamos cuando se confirme.";
  await sendEmail({
    to: o.contactEmail,
    subject: `Tu pedido ${num} en AMORA`,
    text: `¡Hola ${o.contactName}!\n${intro}\n\n${itemsText(o)}\nTotal: ${formatMoney(o.total)}\nEnvío: ${o.shippingCost === null ? "a coordinar" : formatMoney(o.shippingCost)}\n\nVer tu pedido: ${base}/checkout/confirmacion/${o.id}`,
    html: wrap(
      `¡Gracias, ${o.contactName.split(" ")[0]}!`,
      `<p>${intro}</p><p style="color:#6b685f">Pedido ${num}</p>
       <table style="width:100%;border-collapse:collapse">${itemsHtml(o)}${totalsHtml(o)}</table>
       <p style="margin-top:20px"><a href="${base}/checkout/confirmacion/${o.id}" style="background:#767c4e;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Ver mi pedido</a></p>`,
    ),
  });
}

export function deliveryText(o: { shippingStreet: string | null; shippingCity: string | null; shippingProvince: string | null; shippingZip: string | null; shippingZone: string | null }) {
  const addr = [o.shippingStreet, o.shippingCity, o.shippingProvince, o.shippingZip].filter(Boolean).join(", ");
  return addr || o.shippingZone || "Sin datos";
}
