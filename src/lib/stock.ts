/**
 * "Poco stock" = una combinación talle + color con 1 prenda o ninguna.
 * En el panel se muestra agrupado por color: "Negro: XL agotado · L: 1".
 */
export const LOW_STOCK_THRESHOLD = 1;

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return i === -1 ? SIZE_ORDER.length : i;
};

export type LowStockGroup = { color: string; sizes: { size: string; stock: number }[] };

/** Combinaciones con poco stock, agrupadas por color (colores en orden de aparición, talles de chico a grande). */
export function lowStockGroups(variants: { size: string; color: string; stock: number }[]): LowStockGroup[] {
  const byColor = new Map<string, { size: string; stock: number }[]>();
  for (const v of variants) {
    if (v.stock > LOW_STOCK_THRESHOLD) continue;
    const list = byColor.get(v.color) ?? [];
    list.push({ size: v.size, stock: v.stock });
    byColor.set(v.color, list);
  }
  return Array.from(byColor, ([color, sizes]) => ({
    color,
    sizes: sizes.sort((a, b) => sizeRank(a.size) - sizeRank(b.size) || a.size.localeCompare(b.size)),
  }));
}

/** Stock más bajo entre los grupos (para ordenar por urgencia). */
export function minLowStock(groups: LowStockGroup[]) {
  return Math.min(...groups.flatMap((g) => g.sizes.map((s) => s.stock)), Infinity);
}

/** "Negro: XL agotado · L: 1" */
export function formatLowStock(g: LowStockGroup) {
  return `${g.color}: ${g.sizes.map((s) => (s.stock === 0 ? `${s.size} agotado` : `${s.size}: ${s.stock}`)).join(" · ")}`;
}
