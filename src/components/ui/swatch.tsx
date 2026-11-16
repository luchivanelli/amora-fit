import { cn } from "@/lib/utils";
import { swatchBackground } from "@/lib/colors";

/** Círculo de color. Si el hex trae varios tonos ("#fff,#000") se ve dividido en gajos. */
export function Swatch({ hex, className, title }: { hex: string | null | undefined; className?: string; title?: string }) {
  return (
    <span
      aria-hidden
      title={title}
      className={cn("inline-block shrink-0 rounded-full border border-ink/10", className)}
      style={{ background: swatchBackground(hex) }}
    />
  );
}
