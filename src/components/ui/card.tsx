import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-sand-dark/70 bg-surface p-5 shadow-[0_1px_2px_rgba(15,14,11,0.04)]", className)}>{children}</div>;
}

export function SectionCard({
  step,
  title,
  description,
  children,
  id,
  className,
}: {
  step?: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-3xl border border-sand-dark/70 bg-surface p-5 sm:p-6", className)}>
      <header className="mb-5 flex items-start gap-3">
        {step !== undefined && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-sans text-sm font-bold text-brand-800">
            {step}
          </span>
        )}
        <div>
          <h2 className="font-sans text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[15px] text-ink-soft">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
