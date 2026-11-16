import { cn } from "@/lib/utils";

type Tone = "neutral" | "warning" | "success" | "info" | "danger" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink-soft",
  warning: "bg-warn-soft text-warn",
  success: "bg-brand-100 text-brand-800",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-600 text-white",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-muted",
  warning: "bg-warn",
  success: "bg-brand-600",
  info: "bg-info",
  danger: "bg-danger",
  brand: "bg-white",
};

export function Badge({ tone = "neutral", children, dot = true, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
