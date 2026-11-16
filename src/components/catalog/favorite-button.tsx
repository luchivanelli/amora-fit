"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/server/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({ productId, initial, size = "sm", label }: { productId: string; initial: boolean; size?: "sm" | "lg"; label?: boolean }) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const onClick = () => {
    const next = !fav;
    setFav(next); // optimista
    start(async () => {
      const res = await toggleFavorite(productId);
      if (!res.ok) {
        setFav(!next);
        toast.error(res.error);
        return;
      }
      if (res.data.needLogin) {
        setFav(false);
        toast("Ingresá a tu cuenta para guardar favoritos.", { action: { label: "Ingresar", onClick: () => router.push(`/ingresar?callbackUrl=${encodeURIComponent(pathname)}`) } });
        return;
      }
      setFav(res.data.favorite);
      if (res.data.favorite) toast.success("Guardado en favoritos.");
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-surface/95 text-ink shadow-sm transition-colors hover:text-brand-700",
        size === "sm" ? "size-9" : "h-12 px-4",
        label && "border border-sand-dark bg-surface",
      )}
    >
      <Heart className={cn("size-5", fav && "fill-brand-600 text-brand-600")} />
      {label && <span className="text-[15px] font-medium">{fav ? "En favoritos" : "Guardar"}</span>}
    </button>
  );
}
