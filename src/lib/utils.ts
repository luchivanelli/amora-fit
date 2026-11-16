import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return moneyFormatter.format(n);
}

export function formatDate(date: Date | string, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function timeAgo(date: Date | number) {
  const diff = Math.max(0, Date.now() - (typeof date === "number" ? date : date.getTime()));
  const s = Math.round(diff / 1000);
  if (s < 10) return "recién";
  if (s < 60) return `hace ${s} seg`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return formatDate(new Date(typeof date === "number" ? date : date.getTime()), true);
}

export function orderNumber(n: number) {
  return `AM-${String(n).padStart(6, "0")}`;
}

export function discountPercent(price: number | null, compareAt: number | null) {
  if (!price || !compareAt || compareAt <= 0 || price <= 0 || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Quita etiquetas HTML y espacios raros de un texto escrito por una persona. */
export function cleanText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+\n/g, "\n").trim();
}
