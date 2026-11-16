import { Home, Shirt, Package, Tags, TicketPercent, CircleHelp, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/productos", label: "Productos", icon: Shirt },
  { href: "/admin/pedidos", label: "Pedidos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/cupones", label: "Cupones", icon: TicketPercent },
  { href: "/admin/ayuda", label: "Ayuda", icon: CircleHelp },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}
