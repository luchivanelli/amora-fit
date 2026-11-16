import * as React from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Etiqueta + control + ayuda + error, siempre en el mismo orden. */
export function Field({ label, htmlFor, help, error, optional, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[15px] font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-ink-muted">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="text-sm text-ink-muted">{help}</p>
      ) : null}
    </div>
  );
}

const control =
  "w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-muted/80 transition-colors focus:border-brand-500 focus:outline-none disabled:bg-sand/50";

export const inputClass = (error?: boolean, className?: string) =>
  cn(control, "h-12", error ? "border-danger" : "border-sand-dark", className);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export function Input({ error, className, ...props }: InputProps) {
  return <input className={inputClass(error, className)} aria-invalid={error || undefined} {...props} />;
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(control, "min-h-32 py-3 leading-relaxed", error ? "border-danger" : "border-sand-dark", className)}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean };

export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(inputClass(error, className), "appearance-none pr-10")}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Campo de dinero con el $ adelante. Devuelve número o null. */
export function MoneyInput({
  value,
  onChange,
  error,
  ...props
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
      <input
        type="text"
        inputMode="decimal"
        className={inputClass(error, "pl-8")}
        value={value === null ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
          if (raw === "") return onChange(null);
          const n = Number(raw);
          onChange(Number.isNaN(n) ? null : n);
        }}
        aria-invalid={error || undefined}
        {...props}
      />
    </div>
  );
}
