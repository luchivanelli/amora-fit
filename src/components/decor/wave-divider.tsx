import { cn } from "@/lib/utils";

/**
 * Onda separadora entre secciones. El color lo da `className` (ej: text-sand) y
 * `flip` la da vuelta para cerrar una sección en vez de abrirla.
 */
export function WaveDivider({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-10 w-full fill-current sm:h-14 lg:h-20", flip && "rotate-180", className)}
    >
      <path d="M0 48c120 28 240 36 360 24S600 24 720 24s240 28 360 36 240 0 360-24v40H0Z" />
    </svg>
  );
}
