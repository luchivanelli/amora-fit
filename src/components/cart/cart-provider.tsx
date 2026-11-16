"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { CartDTO } from "@/server/queries/shop/cart";
import { addToCart, removeCartItem, syncCart, updateCartItem } from "@/server/actions/cart";

type CartContextValue = {
  cart: CartDTO;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (variantId: string, quantity: number) => Promise<boolean>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  pending: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ initialCart, userId, children }: { initialCart: CartDTO; userId: string | null; children: React.ReactNode }) {
  const [cart, setCart] = useState(initialCart);
  const [isOpen, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const pathname = usePathname();

  // Cerrar el drawer al navegar (por ejemplo, al tocar "Finalizar compra").
  useEffect(() => setOpen(false), [pathname]);

  // El layout vuelve a renderizar tras navegar; mantenemos el carrito al día.
  useEffect(() => setCart(initialCart), [initialCart]);

  // Al iniciar sesión, fusionar el carrito de invitada con el de la cuenta.
  useEffect(() => {
    if (!userId) return;
    void syncCart().then((res) => res.ok && setCart(res.data));
  }, [userId]);

  const add = useCallback(async (variantId: string, quantity: number) => {
    const res = await addToCart({ variantId, quantity });
    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    setCart(res.data);
    setOpen(true);
    return true;
  }, []);

  const update = useCallback(
    async (itemId: string, quantity: number) => {
      const previous = cart;
      setCart((c) => {
        const items = c.items.map((i) => (i.id === itemId ? { ...i, quantity, lineTotal: i.unitPrice * quantity } : i)).filter((i) => i.quantity > 0);
        return { ...c, items, subtotal: items.filter((i) => i.available).reduce((a, i) => a + i.lineTotal, 0), count: items.reduce((a, i) => a + i.quantity, 0) };
      });
      start(async () => {
        const res = await updateCartItem({ itemId, quantity });
        if (!res.ok) {
          setCart(previous);
          toast.error(res.error);
          return;
        }
        setCart(res.data);
      });
    },
    [cart],
  );

  const remove = useCallback(
    async (itemId: string) => {
      const previous = cart;
      setCart((c) => {
        const items = c.items.filter((i) => i.id !== itemId);
        return { ...c, items, subtotal: items.filter((i) => i.available).reduce((a, i) => a + i.lineTotal, 0), count: items.reduce((a, i) => a + i.quantity, 0) };
      });
      start(async () => {
        const res = await removeCartItem(itemId);
        if (!res.ok) {
          setCart(previous);
          toast.error(res.error);
          return;
        }
        setCart(res.data);
      });
    },
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({ cart, isOpen, open: () => setOpen(true), close: () => setOpen(false), add, update, remove, pending }),
    [cart, isOpen, add, update, remove, pending],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
