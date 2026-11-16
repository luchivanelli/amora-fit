"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/components/admin/shell/nav-items";
import { logoutAction } from "@/server/actions/auth";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sand-dark/60 bg-surface lg:flex">
      <div className="px-6 pb-4 pt-7">
        <Wordmark href="/admin" />
        <p className="mt-1 text-sm text-ink-muted">Panel de la tienda</p>
      </div>

      <nav aria-label="Secciones del panel" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition-colors",
                active ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:bg-sand/70 hover:text-ink",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sand-dark/60 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] text-ink-soft hover:bg-sand/70 hover:text-ink"
        >
          <Store className="size-5" aria-hidden />
          Ver mi tienda
        </Link>
        <ThemeToggle label className="h-11 w-full justify-start rounded-2xl px-3 text-ink-soft" />
        <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            <p className="text-xs text-ink-muted">Administradora</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex size-10 items-center justify-center rounded-xl text-ink-muted hover:bg-sand hover:text-ink"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
