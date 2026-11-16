"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "opacity-50")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 block h-7 w-12 shrink-0 rounded-full p-0 transition-colors duration-200",
          checked ? "bg-brand-600" : "bg-sand-dark",
        )}
      >
        {/* Posición fija (left/top) + solo translate: el botón centra su contenido y sin `left` el pulgar salta. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0.5 top-0.5 block size-6 rounded-full bg-surface shadow transition-transform duration-200 ease-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
    </label>
  );
}
