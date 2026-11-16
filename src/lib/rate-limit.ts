import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// Memoria del proceso: suficiente para el login del panel. En serverless cada
// instancia tiene su propio contador, pero igual frena fuerza bruta básica.
const buckets = new Map<string, Bucket>();

export async function getClientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconocida"
  );
}

/**
 * Devuelve `true` si el pedido está permitido.
 * @param key   identificador (ip + acción)
 * @param limit cantidad máxima dentro de la ventana
 * @param windowMs duración de la ventana en milisegundos
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

// Limpieza ocasional para que el mapa no crezca sin límite.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }, 60_000);
  // No mantener vivo el proceso solo por este timer.
  (timer as { unref?: () => void }).unref?.();
}
