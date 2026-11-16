import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, backHref, backLabel = "Volver", action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-[15px] text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {backLabel}
          </Link>
        )}
        <h1 className="truncate text-3xl font-medium text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-ink-soft">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
