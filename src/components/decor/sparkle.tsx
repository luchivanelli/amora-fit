import { cn } from "@/lib/utils";

/** Estrella de cuatro puntas, para acentos ilustrativos. Hereda el color del texto. */
export function Sparkle({ className, pulse = false }: { className?: string; pulse?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 fill-current", pulse && "animate-pulse-soft", className)}>
      <path d="M12 0c.6 7 5 11.4 12 12-7 .6-11.4 5-12 12-.6-7-5-11.4-12-12 7-.6 11.4-5 12-12Z" />
    </svg>
  );
}

/** Eyebrow: etiqueta chiquita en mayúsculas con una estrella adelante. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700", className)}>
      <Sparkle className="size-3 text-blush" />
      {children}
    </p>
  );
}
