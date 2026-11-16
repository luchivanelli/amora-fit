import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Encabezado compacto para celular. En escritorio lo reemplaza la barra lateral. */
export function TopBar({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sand-dark/60 bg-surface/95 px-4 backdrop-blur lg:hidden">
      <Wordmark href="/admin" size="sm" />
      <div className="flex items-center gap-1">
        <span className="max-w-28 truncate text-sm text-ink-soft">{userName}</span>
        <ThemeToggle className="size-10" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-xl text-ink-muted hover:bg-sand hover:text-ink"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
