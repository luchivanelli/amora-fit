"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Barra principal del header: gana sombra y fondo más sólido al hacer scroll. */
export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "h-16 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled ? "border-sand-dark/60 bg-cream/85 shadow-[0_8px_30px_-18px_rgba(15,14,11,0.35)] backdrop-blur-xl" : "border-transparent bg-cream/70 backdrop-blur-md",
      )}
    >
      {children}
    </div>
  );
}
