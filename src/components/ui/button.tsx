import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp" | "blush";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-[background-color,color,transform,box-shadow] duration-300 select-none whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-hover hover:shadow-soft hover:-translate-y-px active:bg-brand-active",
  secondary: "bg-surface text-ink border border-sand-dark hover:border-brand-400 hover:bg-brand-50 hover:-translate-y-px",
  ghost: "bg-transparent text-ink-soft hover:bg-sand hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5b] active:bg-[#1aa851] shadow-sm hover:-translate-y-px",
  blush: "bg-blush-soft text-blush-deep hover:bg-blush hover:text-white hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-7 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & { href: string; prefetch?: boolean };

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  prefetch,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}
