"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

type Props = {
  status: "idle" | "saving" | "saved" | "error" | "dirty";
  savedAt: number | null;
  className?: string;
};

/** Indicador "Guardado ✓" con un pequeño pulso cada vez que se guarda. */
export function SaveFeedback({ status, savedAt, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!ref.current || status !== "saved") return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(ref.current, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)" });
      });
      return () => mm.revert();
    },
    { dependencies: [savedAt, status] },
  );

  const text =
    status === "saving"
      ? "Guardando…"
      : status === "error"
        ? "No se pudo guardar"
        : status === "dirty"
          ? "Cambios sin guardar"
          : savedAt
            ? `Guardado ${timeAgo(savedAt)}`
            : "";

  if (!text) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        status === "error" ? "text-danger" : status === "dirty" ? "text-warn" : "text-ink-soft",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {status === "saved" && (
        <span ref={ref} className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white">
          <Check className="size-3.5" aria-hidden />
        </span>
      )}
      {status === "error" && <CloudOff className="size-4" aria-hidden />}
      {text}
    </span>
  );
}
