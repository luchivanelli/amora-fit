import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "warning" | "neutral";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Texto chico al lado del número (ej. "+12%"). */
  badge?: { text: string; tone: "up" | "down" | "flat" };
  href: string;
  tone?: Tone;
  /** Detalle debajo del número (filas o chips). */
  children?: React.ReactNode;
};

const accent: Record<Tone, string> = {
  brand: "bg-brand-500",
  warning: "bg-warn",
  neutral: "bg-sand-dark",
};

const iconTone: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700",
  warning: "bg-warn-soft text-warn",
  neutral: "bg-sand text-ink-soft",
};

export function StatCard({ icon: Icon, label, value, badge, href, tone = "neutral", children }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-sand-dark/70 bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
    >
      {/* Franja de color arriba: indica si la tarjeta pide atención. */}
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", accent[tone])} />

      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconTone[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-soft">{label}</p>
        <ArrowUpRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <p className="font-sans text-4xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              badge.tone === "up" && "bg-brand-100 text-brand-700",
              badge.tone === "down" && "bg-danger-soft text-danger",
              badge.tone === "flat" && "bg-sand text-ink-soft",
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {children && <div className="mt-auto border-t border-sand pt-3 text-sm text-ink-soft">{children}</div>}
    </Link>
  );
}

/** Fila "etiqueta ........ valor" para el detalle de una StatCard. */
export function StatRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="truncate">{label}</span>
      <span className={cn("shrink-0 font-semibold tabular-nums", highlight ? "text-ink" : "text-ink-soft")}>{value}</span>
    </div>
  );
}
