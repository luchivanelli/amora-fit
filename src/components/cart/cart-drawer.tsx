"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/utils";
import { MAX_QTY_PER_LINE } from "@/lib/cart-cookie";
import { LinkButton } from "@/components/ui/button";

gsap.registerPlugin(useGSAP);

export function CartDrawer() {
  const { cart, isOpen, close, update, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Montar al abrir; desmontar cuando termina la animación de cierre.
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useGSAP(
    () => {
      if (!mounted || !panel.current || !overlay.current) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isOpen) {
        if (reduce) {
          gsap.set([overlay.current, panel.current], { autoAlpha: 1, x: 0 });
        } else {
          gsap.timeline()
            .fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 })
            .fromTo(panel.current, { x: "100%" }, { x: 0, duration: 0.4, ease: "power3.out" }, "<");
        }
        closeBtn.current?.focus();
      } else {
        if (reduce) {
          setMounted(false);
          return;
        }
        gsap.timeline({ onComplete: () => setMounted(false) })
          .to(panel.current, { x: "100%", duration: 0.3, ease: "power3.in" })
          .to(overlay.current, { autoAlpha: 0, duration: 0.2 }, "<0.1");
      }
    },
    { dependencies: [isOpen, mounted] },
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div ref={overlay} className="absolute inset-0 bg-scrim/50 opacity-0" onClick={close} aria-hidden />
      <div ref={panel} className="absolute inset-y-0 right-0 flex w-full max-w-md translate-x-full flex-col bg-surface shadow-lift sm:rounded-l-4xl">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 id="cart-title" className="font-sans text-lg font-semibold">
            Tu carrito {cart.count > 0 && <span className="text-ink-muted">({cart.count})</span>}
          </h2>
          <button ref={closeBtn} type="button" onClick={close} className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-sand hover:text-ink" aria-label="Cerrar carrito">
            <X className="size-5" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShoppingBag className="size-7" aria-hidden />
            </span>
            <p className="text-lg font-medium">Tu carrito está vacío</p>
            <p className="text-[15px] text-ink-soft">Explorá la tienda y encontrá tu próxima prenda favorita.</p>
            <button type="button" onClick={close} className="mt-2 text-[15px] font-medium text-brand-700 underline-offset-4 hover:underline">
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-sand overflow-y-auto px-5">
              {cart.items.map((i) => (
                <li key={i.id} className="flex gap-4 py-4">
                  <Link href={`/producto/${i.slug}`} onClick={close} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {i.imageUrl && <Image src={i.imageUrl} alt={i.productName} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/producto/${i.slug}`} onClick={close} className="line-clamp-2 text-[15px] font-medium hover:underline">
                          {i.productName}
                        </Link>
                        <p className="text-sm text-ink-muted">
                          Talle {i.size} · {i.color}
                        </p>
                      </div>
                      <button type="button" onClick={() => remove(i.id)} className="-mr-2 rounded-lg p-2 text-ink-muted hover:bg-danger-soft hover:text-danger" aria-label={`Quitar ${i.productName}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {!i.available ? (
                      <p className="mt-auto text-sm text-warn">Sin stock ahora. Quitalo o volvé más tarde.</p>
                    ) : (
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-sand-dark">
                          <button type="button" onClick={() => update(i.id, i.quantity - 1)} className="flex size-9 items-center justify-center rounded-full hover:bg-sand" aria-label="Restar uno">
                            <Minus className="size-4" />
                          </button>
                          <span className="w-8 text-center text-[15px] font-medium" aria-live="polite">
                            {i.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => update(i.id, i.quantity + 1)}
                            disabled={i.quantity >= Math.min(i.stock, MAX_QTY_PER_LINE)}
                            className="flex size-9 items-center justify-center rounded-full hover:bg-sand disabled:opacity-40"
                            aria-label="Sumar uno"
                          >
                            <Plus className="size-4" />
                          </button>
                        </div>
                        <span className="font-semibold">{formatMoney(i.lineTotal)}</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-sand px-5 py-4 safe-bottom">
              <div className="mb-1 flex items-center justify-between text-lg">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">{formatMoney(cart.subtotal)}</span>
              </div>
              <p className="mb-4 text-sm text-ink-muted">El envío se calcula o coordina en el siguiente paso.</p>
              <LinkButton href="/checkout" size="lg" fullWidth>
                Finalizar compra
              </LinkButton>
              <button type="button" onClick={close} className="mt-3 w-full text-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
