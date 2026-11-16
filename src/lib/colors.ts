/**
 * Un "color" de producto puede combinar varios tonos (ej: "Blanco y Negro").
 * En la base se guarda como un único nombre y los hex separados por coma: "#ffffff,#1f1f1f".
 */

export const FALLBACK_HEX = "#dddddd";
export const MAX_TONES_PER_COLOR = 4;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** "#fff,#000" -> ["#fff", "#000"]. Ignora lo que no sea un hex válido. */
export function parseHexes(hex: string | null | undefined): string[] {
  if (!hex) return [];
  return hex
    .split(",")
    .map((h) => h.trim())
    .filter((h) => HEX_RE.test(h));
}

export function joinHexes(hexes: string[]): string {
  return hexes.join(",");
}

/** Fondo del círculo de color: un tono liso o una "torta" con los tonos combinados. */
export function swatchBackground(hex: string | null | undefined): string {
  const list = parseHexes(hex);
  if (list.length === 0) return FALLBACK_HEX;
  if (list.length === 1) return list[0];
  const step = 360 / list.length;
  const stops = list.map((h, i) => `${h} ${i * step}deg ${(i + 1) * step}deg`).join(", ");
  return `conic-gradient(${stops})`;
}

/** ["Blanco", "Negro"] -> "Blanco y Negro"; ["Blanco", "Negro", "Rosa"] -> "Blanco, Negro y Rosa". */
export function joinColorNames(names: string[]): string {
  const list = names.map((n) => n.trim()).filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} y ${list[list.length - 1]}`;
}
