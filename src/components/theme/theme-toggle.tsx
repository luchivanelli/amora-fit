"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/** Botón sol/luna con giro al cambiar. Si recibe `label`, muestra el texto al lado. */
export function ThemeToggle({ className, label = false }: { className?: string; label?: boolean }) {
  const { resolved, toggle } = useTheme();
  const icon = useRef<HTMLSpanElement>(null);
  const isDark = resolved === "dark";

  const { contextSafe } = useGSAP({ scope: icon });
  const spin = contextSafe(() => {
    if (!icon.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(icon.current, { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.5, ease: "back.out(2)" });
  });

  return (
    <button
      type="button"
      onClick={() => {
        toggle();
        spin();
      }}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full text-ink transition-colors hover:bg-sand",
        label ? "h-11 px-4 text-[15px] font-medium" : "size-11",
        className,
      )}
    >
      <span ref={icon} className="flex items-center justify-center">
        {isDark ? <Sun className="size-5 text-warn" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      </span>
      {label && <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
