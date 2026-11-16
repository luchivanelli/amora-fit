"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Selector de los hijos a animar en cascada. Si no se pasa, anima el contenedor. */
  stagger?: string;
  delay?: number;
  as?: "div" | "section" | "ul";
  id?: string;
};

/** Aparece suavemente al entrar en pantalla. Con prefers-reduced-motion no anima. */
export function RevealOnScroll({ children, className, stagger, delay = 0, as = "div", id }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger ? ref.current!.querySelectorAll(stagger) : ref.current!;
        gsap.fromTo(
          targets,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            delay,
            stagger: stagger ? 0.08 : 0,
            scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const Tag = as;
  // @ts-expect-error ref tipado genérico para las tres etiquetas
  return <Tag ref={ref} id={id} className={cn(className)}>{children}</Tag>;
}
