import * as React from "react";
import { Blob } from "@/components/decor/blob";
import { Sparkle } from "@/components/decor/sparkle";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-dashed border-sand-dark bg-surface/60 px-6 py-14 text-center">
      <Blob tone="blush" blur className="-left-10 -top-10 size-48 opacity-70" />
      <Blob tone="brand" shape={1} blur className="-bottom-12 -right-8 size-56 opacity-70" />
      {icon && (
        <div className="relative mb-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">{icon}</div>
          <Sparkle className="absolute -right-1 -top-1 size-4 text-blush" pulse />
        </div>
      )}
      <h3 className="relative font-sans text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="relative mt-1 max-w-sm text-[15px] text-ink-soft">{description}</p>}
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
