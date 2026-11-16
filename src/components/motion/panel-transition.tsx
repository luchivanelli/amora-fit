"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Entrada suave del contenido al cambiar de sección. Se apaga con prefers-reduced-motion. */
export function PanelTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", clearProps: "transform" },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [pathname], scope: ref },
  );

  return (
    <div ref={ref} key={pathname}>
      {children}
    </div>
  );
}
