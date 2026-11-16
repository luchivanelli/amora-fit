"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import modeloIntimo from "@/images/modelo-intimo.webp";
import modeloDiario from "@/images/modelo-diario.jpeg";
import modeloDeportivo from "@/images/modelo-deportivo.jpeg";
import { Eyebrow } from "@/components/decor/sparkle";
import { Blob } from "@/components/decor/blob";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SHOTS: { src: StaticImageData; speed: number; className: string; label: string }[] = [
  { src: modeloIntimo, speed: -40, className: "mt-16 aspect-[3/4] sm:mt-24", label: "Ropa íntima" },
  { src: modeloDiario, speed: 30, className: "aspect-[4/5]", label: "Para todos los días" },
  { src: modeloDeportivo, speed: -20, className: "mt-10 aspect-[3/4] sm:mt-16", label: "Ropa deportiva" },
];

/** Banda editorial: tres fotos con parallax al hacer scroll y una frase de marca. */
export function Lookbook() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-shot]").forEach((el) => {
          const speed = Number(el.dataset.speed);
          gsap.fromTo(el, { y: -speed }, { y: speed, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        });
        gsap.from("[data-look-text]", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden py-20 lg:py-28" aria-labelledby="lookbook-title">
      <Blob tone="brand" blur className="-left-32 top-10 size-[36rem] opacity-70" />
      <Blob tone="blush" shape={2} blur className="-right-32 bottom-0 size-[32rem] opacity-60" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">Nuestra esencia</Eyebrow>
          <h2 id="lookbook-title" data-look-text className="mt-3 text-4xl font-medium sm:text-5xl lg:text-6xl">
            Hecha para acompañarte, <em className="italic text-brand-700">de la mañana a la noche</em>.
          </h2>
          <p data-look-text className="mt-4 text-lg text-ink-soft">
            Telas suaves, costuras que no se sienten y diseños que se adaptan a vos.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {SHOTS.map((s, i) => (
            <figure key={i} data-shot data-speed={s.speed} className={`group relative overflow-hidden rounded-3xl bg-sand will-change-transform sm:rounded-4xl ${s.className}`}>
              <Image src={s.src} alt="" fill placeholder="blur" sizes="(max-width: 640px) 33vw, 30vw" className="theme-dim object-cover transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-2 bottom-2 rounded-full bg-paper/90 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#40432f] sm:inset-x-4 sm:bottom-4 sm:text-xs">
                {s.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <div data-look-text className="mt-12 text-center">
          <Link href="/tienda" className="group inline-flex h-14 items-center gap-2 rounded-full border border-ink/15 bg-surface px-7 text-lg font-medium text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-soft">
            Ver toda la tienda
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
