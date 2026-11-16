"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { setProductFeatured } from "@/server/actions/admin/products";

/** Estrella para marcar/desmarcar un producto como destacado de la portada. */
export function FeaturedToggle({ productId, name, featured, disabled }: { productId: string; name: string; featured: boolean; disabled?: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(featured);
  const [pending, start] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next); // optimista
    start(async () => {
      const res = await setProductFeatured(productId, next);
      if (!res.ok) {
        setOn(!next);
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Listo, aparece en “Productos destacados”." : "Listo, ya no está en destacados.");
      router.refresh();
    });
  };

  const label = on ? `Quitar ${name} de destacados` : `Destacar ${name} en la portada`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || pending}
      aria-pressed={on}
      aria-label={label}
      title={on ? "Destacado en la portada (tocá para quitar)" : "Destacar en la portada"}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40",
        on ? "text-warn hover:bg-warn-soft" : "text-ink-muted hover:bg-sand hover:text-ink",
      )}
    >
      <Star className={cn("size-5", on && "fill-current")} aria-hidden />
    </button>
  );
}
