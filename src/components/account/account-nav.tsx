"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, MapPin, Heart, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

const ITEMS = [
  { href: "/cuenta", label: "Mis datos", icon: User },
  { href: "/cuenta/pedidos", label: "Mis pedidos", icon: Package },
  { href: "/cuenta/direcciones", label: "Direcciones", icon: MapPin },
  { href: "/cuenta/favoritos", label: "Favoritos", icon: Heart },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi cuenta" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/cuenta" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-[15px] font-medium", active ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-sand hover:text-ink")}>
            <Icon className="size-5" aria-hidden /> {label}
          </Link>
        );
      })}
      {isAdmin && (
        <Link href="/admin" className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-brand-700 hover:bg-brand-50">
          <LayoutDashboard className="size-5" aria-hidden /> Panel de la tienda
        </Link>
      )}
      <form action={logoutAction} className="shrink-0 lg:mt-4">
        <button type="submit" className="flex h-11 items-center gap-2 rounded-xl px-3 text-[15px] text-ink-muted hover:bg-sand hover:text-ink">
          <LogOut className="size-5" aria-hidden /> Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
