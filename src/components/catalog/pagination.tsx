import { Fragment } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  /** Cantidad total de productos y tamaño de página, para el texto "Mostrando 1–8 de 23". */
  total?: number;
  pageSize?: number;
  basePath: string;
  params: Record<string, string | undefined>;
};

export function Pagination({ page, totalPages, total, pageSize, basePath, params }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  // Siempre: primera, última, la actual y sus vecinas. El resto se resume con "…".
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  const from = total && pageSize ? (page - 1) * pageSize + 1 : null;
  const to = total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <nav aria-label="Paginación" className="mt-14 flex flex-col items-center gap-4">
      <div className="flex items-center gap-1.5 rounded-full border border-sand-dark/70 bg-surface p-1.5 shadow-sm">
        <EdgeLink href={href(page - 1)} disabled={page <= 1} label="Anterior">
          <ChevronLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Anterior</span>
        </EdgeLink>

        <ol className="flex items-center gap-1">
          {pages.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && pages[i - 1] !== p - 1 && (
                <li aria-hidden className="w-6 text-center text-ink-muted">
                  …
                </li>
              )}
              <li>
                <PageLink href={href(p)} active={p === page}>
                  {p}
                </PageLink>
              </li>
            </Fragment>
          ))}
        </ol>

        <EdgeLink href={href(page + 1)} disabled={page >= totalPages} label="Siguiente">
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-4" aria-hidden />
        </EdgeLink>
      </div>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {from !== null && to !== null ? (
          <>
            Mostrando <span className="font-medium text-ink-soft">{from}–{to}</span> de {total} {total === 1 ? "producto" : "productos"} · Página {page} de {totalPages}
          </>
        ) : (
          <>
            Página {page} de {totalPages}
          </>
        )}
      </p>
    </nav>
  );
}

function PageLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={`Página ${children}`}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full text-[15px] font-medium transition-all",
        active ? "bg-brand-600 text-white shadow-sm" : "text-ink hover:bg-brand-50 hover:text-brand-800",
      )}
    >
      {children}
    </Link>
  );
}

function EdgeLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  const cls = "inline-flex h-10 items-center gap-1 rounded-full px-3 text-[15px] font-medium transition-colors";
  if (disabled) {
    return (
      <span className={cn(cls, "cursor-not-allowed text-ink-muted/60")} aria-disabled aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(cls, "text-ink hover:bg-sand")} aria-label={`Página ${label.toLowerCase()}`}>
      {children}
    </Link>
  );
}
