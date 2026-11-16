import { unstable_cache } from "next/cache";

/**
 * Etiquetas de caché. Las lecturas de la tienda se cachean con estas etiquetas
 * y el panel las invalida al guardar (revalidateTag), así los cambios se ven al instante
 * pero las visitas no golpean la base en cada navegación.
 */
export const TAGS = {
  products: "products",
  categories: "categories",
} as const;

const DEFAULT_REVALIDATE = 60 * 10; // 10 min de respaldo, por si alguna invalidación se pierde

/** Envuelve una consulta de solo lectura (sin cookies/headers) en el Data Cache de Next. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cached<F extends (...args: any[]) => Promise<unknown>>(fn: F, key: string, tags: string[], revalidate = DEFAULT_REVALIDATE): F {
  return unstable_cache(fn, [key], { tags, revalidate }) as F;
}
