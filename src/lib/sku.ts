import { slugify } from "@/lib/slug";

function code(text: string, len: number) {
  const clean = slugify(text).replace(/-/g, "").toUpperCase();
  return (clean || "X").slice(0, len).padEnd(len, "X");
}

/** Código interno automático: AM-CONJ-M-OLI-7K2P. La dueña nunca lo escribe. */
export function generateSku(productName: string, size: string, color: string) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AM-${code(productName, 4)}-${code(size, 3)}-${code(color, 3)}-${rand}`;
}

export async function uniqueSku(
  productName: string,
  size: string,
  color: string,
  exists: (sku: string) => Promise<boolean>,
) {
  for (let i = 0; i < 5; i++) {
    const sku = generateSku(productName, size, color);
    if (!(await exists(sku))) return sku;
  }
  return `AM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
