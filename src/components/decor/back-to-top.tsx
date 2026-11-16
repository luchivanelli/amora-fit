"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const R = 20;
const CIRC = 2 * Math.PI * R;

/** Botón "subir" con un anillo que muestra cuánto se recorrió de la página. Aparece después de un scroll. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const ring = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (ring.current) ring.current.style.strokeDashoffset = String(CIRC * (1 - p));
      setVisible(window.scrollY > 600);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-surface text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:text-brand-700 sm:bottom-7 sm:right-7",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={R} className="fill-none stroke-sand-dark" strokeWidth="2.5" />
        <circle
          ref={ring}
          cx="24"
          cy="24"
          r={R}
          className="fill-none stroke-brand-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
        />
      </svg>
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
