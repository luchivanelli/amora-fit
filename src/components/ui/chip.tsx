"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Swatch } from "@/components/ui/swatch";

type ChipProps = {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  swatch?: string | null;
  "aria-label"?: string;
};

/** Botón redondo tocable para talles y colores. */
export function Chip({ selected, onClick, children, className, swatch, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-colors",
        selected
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-sand-dark bg-surface text-ink hover:border-brand-400 hover:bg-brand-50",
        className,
      )}
      {...rest}
    >
      {swatch && <Swatch hex={swatch} className="size-4" />}
      {children}
      {selected && <Check className="size-4" aria-hidden />}
    </button>
  );
}
