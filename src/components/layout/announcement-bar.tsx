"use client";

import { useEffect, useState } from "react";
import { Sparkle } from "@/components/decor/sparkle";
import { cn } from "@/lib/utils";

const MESSAGES = [
  "Envíos GRATIS dentro de Villa Constitución",
  "Cambios sin cargo dentro de los 30 días",
  "Talles reales, del XS al XXL",
];

/** Barra superior con mensajes que rotan cada pocos segundos. */
export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex h-8 items-center justify-center overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 px-4 text-xs font-medium tracking-wide text-white sm:text-sm" aria-live="polite">
      <Sparkle className="mr-2 size-3 text-olive-light" pulse />
      <span className="relative block h-5 w-full max-w-xl text-center">
        {MESSAGES.map((m, idx) => (
          <span
            key={m}
            className={cn("absolute inset-0 transition-all duration-500", idx === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}
            aria-hidden={idx !== i}
          >
            {m}
          </span>
        ))}
      </span>
    </div>
  );
}
