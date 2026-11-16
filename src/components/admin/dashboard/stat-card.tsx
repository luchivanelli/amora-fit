import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href: string;
  tone?: "brand" | "warning" | "neutral";
};

export function StatCard({ icon: Icon, label, value, hint, href, tone = "neutral" }: StatCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-36 flex-col justify-between rounded-2xl border p-5 transition-colors",
        tone === "brand" && "border-brand-200 bg-brand-50 hover:bg-brand-100",
        tone === "warning" && "border-warn/30 bg-warn-soft hover:bg-warn-soft",
        tone === "neutral" && "border-sand-dark/70 bg-surface hover:bg-sand/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "warning" ? "bg-warn/20 text-warn" : "bg-brand-100 text-brand-700",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <ArrowRight className="size-5 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      <div>
        <p className="font-sans text-3xl font-semibold text-ink">{value}</p>
        <p className="text-[15px] font-medium text-ink-soft">{label}</p>
        {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
      </div>
    </Link>
  );
}
