import { Sparkle } from "@/components/decor/sparkle";
import { cn } from "@/lib/utils";

/**
 * Cinta de texto que se desplaza sin fin. Duplica el contenido para que el loop sea continuo.
 * Se pausa al pasar el mouse y se frena con prefers-reduced-motion.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          <span>{t}</span>
          <Sparkle className="size-3.5 text-blush" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("pause-on-hover flex overflow-hidden font-display text-lg tracking-wide sm:text-xl", className)} role="marquee">
      <span className="sr-only">{items.join(" · ")}</span>
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
