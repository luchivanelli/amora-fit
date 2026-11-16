"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkle } from "@/components/decor/sparkle";
import { useSelectedColor } from "@/components/product/color-context";

type Img = { id: string; url: string; alt: string; color?: string | null };

export function Gallery({ images, badges }: { images: Img[]; badges?: React.ReactNode }) {
  const { color } = useSelectedColor();
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null);

  // Con un color elegido: primero sus fotos, después las que no tienen color.
  // Si ese color no tiene fotos propias, se muestran todas.
  const visible = useMemo(() => {
    if (!color) return images;
    const own = images.filter((i) => i.color === color);
    if (own.length === 0) return images;
    return [...own, ...images.filter((i) => !i.color)];
  }, [images, color]);

  // Al cambiar de color, volver a la primera foto.
  useEffect(() => setActive(0), [color]);

  const main = visible[active] ?? visible[0];

  // Fundido suave al cambiar de foto o de color.
  useGSAP(
    () => {
      if (!frame.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(frame.current.querySelector("[data-main]"), { autoAlpha: 0.4, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out" });
    },
    { dependencies: [active, color], scope: frame },
  );

  if (!main) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-4xl bg-sand text-ink-muted">
        <Sparkle className="size-6 text-brand-300" />
        Sin fotos
      </div>
    );
  }

  const go = (d: number) => setActive((i) => (i + d + visible.length) % visible.length);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div ref={frame} className="group relative aspect-[4/5] flex-1 overflow-hidden rounded-4xl bg-sand">
        <Image key={main.id} data-main src={main.url} alt={main.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="theme-dim object-cover" priority />
        {badges && <div className="absolute left-4 top-4 flex gap-2">{badges}</div>}
        {visible.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-[#2b2a26] shadow-soft transition-all hover:bg-paper md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper/90 text-[#2b2a26] shadow-soft transition-all hover:bg-paper md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-semibold text-[#2b2a26]" aria-live="polite">
              {Math.min(active, visible.length - 1) + 1} / {visible.length}
            </span>
          </>
        )}
      </div>
      {visible.length > 1 && (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto md:w-20 md:flex-col" aria-label="Más fotos">
          {visible.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === active}
                className={cn("relative block size-20 overflow-hidden rounded-2xl bg-sand ring-2 ring-offset-2 ring-offset-cream transition-all", i === active ? "ring-brand-600" : "ring-transparent opacity-70 hover:opacity-100 hover:ring-sand-dark")}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="theme-dim object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
