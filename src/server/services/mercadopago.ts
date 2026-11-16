import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Falta MP_ACCESS_TOKEN");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

type PreferenceInput = {
  orderId: string;
  orderNumber: string;
  items: { title: string; quantity: number; unitPrice: number; imageUrl?: string | null }[];
  shippingCost: number | null;
  discount: number;
  payer: { name: string; email: string };
  expiresAt: Date;
};

/** Crea la preferencia de Checkout Pro y devuelve el link de pago. */
export async function createCheckoutPreference(input: PreferenceInput) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const items = input.items.map((i, idx) => ({
    id: `${input.orderId}-${idx}`,
    title: i.title.slice(0, 250),
    quantity: i.quantity,
    unit_price: Math.round(i.unitPrice * 100) / 100,
    currency_id: "ARS",
    picture_url: i.imageUrl ?? undefined,
  }));
  if (input.shippingCost && input.shippingCost > 0) {
    items.push({ id: `${input.orderId}-envio`, title: "Envío", quantity: 1, unit_price: input.shippingCost, currency_id: "ARS", picture_url: undefined });
  }
  if (input.discount > 0) {
    // MP no acepta ítems negativos: el descuento se prorratea restándolo del primer ítem.
    const first = items[0];
    const perUnit = Math.round((input.discount / first.quantity) * 100) / 100;
    first.unit_price = Math.max(0.01, Math.round((first.unit_price - perUnit) * 100) / 100);
  }

  const pref = await new Preference(client()).create({
    body: {
      items,
      payer: { name: input.payer.name, email: input.payer.email },
      external_reference: input.orderId,
      metadata: { order_id: input.orderId, order_number: input.orderNumber },
      back_urls: {
        success: `${base}/checkout/retorno?estado=aprobado&pedido=${input.orderId}`,
        pending: `${base}/checkout/retorno?estado=pendiente&pedido=${input.orderId}`,
        failure: `${base}/checkout/retorno?estado=rechazado&pedido=${input.orderId}`,
      },
      auto_return: "approved",
      notification_url: `${base}/api/webhooks/mercadopago`,
      statement_descriptor: "AMORA",
      expires: true,
      expiration_date_to: input.expiresAt.toISOString(),
    },
  });

  if (!pref.id || !pref.init_point) throw new Error("Mercado Pago no devolvió el link de pago");
  return { preferenceId: pref.id, initPoint: pref.init_point };
}

export async function fetchPayment(paymentId: string) {
  return new Payment(client()).get({ id: paymentId });
}

/**
 * Verifica la firma del webhook (header x-signature) según la documentación de MP:
 * manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"  →  HMAC-SHA256 con la clave secreta.
 */
export function verifyWebhookSignature(opts: { xSignature: string | null; xRequestId: string | null; dataId: string | null }) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // en desarrollo se permite sin firma
  if (!opts.xSignature || !opts.dataId) return false;

  const parts = Object.fromEntries(
    opts.xSignature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${opts.dataId};request-id:${opts.xRequestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch {
    return false;
  }
}
