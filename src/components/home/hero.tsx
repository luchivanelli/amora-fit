"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ChevronDown, Ruler, RefreshCcw, Truck, Heart } from "lucide-react";
import fondo from "@/images/fondo.jpg";
import { Blob } from "@/components/decor/blob";
import { Sparkle } from "@/components/decor/sparkle";

gsap.registerPlugin(useGSAP);

// Forma orgánica (coordenadas 0..1) que recorta la foto principal.
const BLOB_PATH =
  "M0.52,0.015 C0.74,0.01,0.95,0.12,0.975,0.36 C1,0.6,0.92,0.86,0.7,0.965 C0.48,1.07,0.17,0.95,0.06,0.73 C-0.05,0.51,0.03,0.22,0.2,0.09 C0.3,0.02,0.41,0.02,0.52,0.015 Z";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-blob]", { scale: 0.6, autoAlpha: 0, duration: 1.4, stagger: 0.15, ease: "power2.out" }, 0)
          .from("[data-hero-line]", { y: 34, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0.25)
          .from("[data-hero-image]", { scale: 0.88, autoAlpha: 0, rotate: -4, duration: 1.2, ease: "power3.out" }, 0.35)
          .from("[data-hero-card]", { y: 20, scale: 0.8, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: "back.out(2)" }, 0.9)
          .from("[data-hero-hint]", { y: -8, autoAlpha: 0, duration: 0.6 }, "-=0.3");

        // Flotación continua de las tarjetitas y las manchas de fondo.
        gsap.utils.toArray<HTMLElement>("[data-hero-card]").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.6 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.6 });
        });
        gsap.to("[data-hero-blob='a']", { x: 40, y: -30, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to("[data-hero-blob='b']", { x: -30, y: 40, duration: 11, yoyo: true, repeat: -1, ease: "sine.inOut" });

        // Parallax sutil con el mouse (solo con puntero fino).
        if (window.matchMedia("(pointer: fine)").matches && root.current) {
          const moveImg = gsap.quickTo("[data-hero-image]", "x", { duration: 0.8, ease: "power3" });
          const moveImgY = gsap.quickTo("[data-hero-image]", "y", { duration: 0.8, ease: "power3" });
          const moveA = gsap.quickTo("[data-hero-blob='a']", "xPercent", { duration: 1.2, ease: "power3" });
          const moveB = gsap.quickTo("[data-hero-blob='b']", "xPercent", { duration: 1.2, ease: "power3" });
          const onMove = (e: MouseEvent) => {
            const r = root.current!.getBoundingClientRect();
            const dx = (e.clientX - r.left) / r.width - 0.5;
            const dy = (e.clientY - r.top) / r.height - 0.5;
            moveImg(dx * 18);
            moveImgY(dy * 14);
            moveA(dx * 6);
            moveB(-dx * 6);
          };
          root.current.addEventListener("mousemove", onMove);
          return () => root.current?.removeEventListener("mousemove", onMove);
        }
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-hero-blob], [data-hero-line], [data-hero-image], [data-hero-card], [data-hero-hint]", { autoAlpha: 1, scale: 1, y: 0, rotate: 0 });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="grain relative flex min-h-[calc(100svh-6rem)] w-full items-center overflow-hidden" aria-label="Bienvenida">
      {/* Manchas de color de fondo */}
      <Blob data-hero-blob="a" tone="brand" blur className="-left-24 -top-32 size-[34rem] opacity-90 sm:size-[44rem]" />
      <Blob data-hero-blob="b" tone="blush" shape={1} blur className="-bottom-40 -right-24 size-[30rem] opacity-80 sm:size-[40rem]" />

      {/* clipPath para la foto */}
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id="hero-blob" clipPathUnits="objectBoundingBox">
            <path d={BLOB_PATH} />
          </clipPath>
        </defs>
      </svg>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-10">
        {/* Texto */}
        <div className="max-w-2xl">
          <p data-hero-line className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700 backdrop-blur">
            <Sparkle className="size-3 text-blush" pulse />
            Ropa íntima & deportiva
          </p>
          <h1 data-hero-line className="text-[2.9rem] font-medium leading-[1] sm:text-6xl lg:text-7xl xl:text-[5.6rem]">
            Cómoda con vos,{" "}
            <em className="underline-squiggle font-normal italic text-brand-700">todos</em> los días.
          </h1>
          <p data-hero-line className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">
            Diseñada para moverte, entrenar y descansar sin pensar en lo que llevás puesto. Suave, flexible y para todos los cuerpos.
          </p>
          <div data-hero-line className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tienda?categoria=ropa-intima"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 text-lg font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
            >
              Ver ropa íntima
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/tienda?categoria=ropa-deportiva"
              className="inline-flex h-14 items-center justify-center rounded-full border border-ink/15 bg-surface/60 px-7 text-lg font-medium text-ink backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:bg-surface"
            >
              Ver ropa deportiva
            </Link>
          </div>
          <ul data-hero-line className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-soft">
            {[
              { icon: Truck, text: "Envío gratis en Villa Constitución" },
              { icon: RefreshCcw, text: "Cambios sin cargo" },
              { icon: Ruler, text: "Guía de talles real" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Composición ilustrativa */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
          <div data-hero-image className="relative aspect-[4/5] will-change-transform" style={{ clipPath: "url(#hero-blob)" }}>
            <Image src={fondo} alt="" fill priority placeholder="blur" sizes="(max-width: 1024px) 90vw, 45vw" className="theme-dim object-cover object-center" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-scrim/35 via-transparent to-transparent" />
          </div>

          {/* Tarjetitas flotantes */}
          <div data-hero-card className="absolute -left-3 top-8 flex items-center gap-3 rounded-2xl border border-sand-dark/60 bg-surface/90 px-4 py-3 shadow-soft backdrop-blur sm:-left-8">
            <span className="flex size-10 items-center justify-center rounded-full bg-blush-soft text-blush-deep">
              <Ruler className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">Talles reales</span>
              <span className="block text-xs text-ink-muted">Del XS al XXL</span>
            </span>
          </div>
          <div data-hero-card className="absolute -right-2 bottom-16 flex items-center gap-3 rounded-2xl border border-sand-dark/60 bg-surface/90 px-4 py-3 shadow-soft backdrop-blur sm:-right-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Heart className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">Hecho con cariño</span>
              <span className="block text-xs text-ink-muted">Desde Villa Constitución</span>
            </span>
          </div>

          {/* Sello giratorio */}
          <div data-hero-card className="absolute -bottom-4 left-4 size-28 sm:size-32">
            <svg viewBox="0 0 100 100" className="size-full animate-spin-slow text-brand-700" aria-hidden>
              <defs>
                <path id="hero-circle" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
              </defs>
              <text className="fill-current font-sans text-[9.2px] font-semibold uppercase tracking-[0.22em]">
                <textPath href="#hero-circle">Nuevos ingresos · cada semana ·</textPath>
              </text>
            </svg>
            <span className="absolute inset-0 m-auto flex size-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft">
              <Sparkle className="size-5" />
            </span>
          </div>

          <Sparkle className="absolute -top-2 right-10 size-6 text-blush" pulse />
          <Sparkle className="absolute right-2 top-24 size-3 text-brand-400" pulse />
        </div>
      </div>

      {/* Indicador de scroll */}
      <a
        href="#contenido"
        data-hero-hint
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium uppercase tracking-widest text-ink-muted hover:text-ink lg:flex"
      >
        Descubrir
        <ChevronDown className="size-5 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
