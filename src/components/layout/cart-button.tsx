"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";

gsap.registerPlugin(useGSAP);

export function CartButton() {
  const { cart, open } = useCart();
  const ref = useRef<HTMLButtonElement>(null);
  const prev = useRef(cart.count);

  // Pequeño rebote cuando cambia la cantidad (se agregó algo al carrito).
  const { contextSafe } = useGSAP({ scope: ref });
  const bounce = contextSafe(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    gsap.fromTo("[data-badge]", { scale: 0.4 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
  });
  useEffect(() => {
    if (cart.count > prev.current) bounce();
    prev.current = cart.count;
  }, [cart.count, bounce]);

  return (
    <button ref={ref} type="button" onClick={open} className="relative flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand" aria-label={`Abrir carrito, ${cart.count} ${cart.count === 1 ? "producto" : "productos"}`}>
      <ShoppingBag className="size-5" />
      {cart.count > 0 && (
        <span data-badge className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-blush text-[11px] font-bold text-white ring-2 ring-cream" aria-hidden>
          {cart.count > 9 ? "9+" : cart.count}
        </span>
      )}
    </button>
  );
}
