import { auth } from "@/lib/auth";
import { getShopCategories } from "@/server/queries/shop/categories";
import { getCart } from "@/server/queries/shop/cart";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackToTop } from "@/components/decor/back-to-top";
import { ThemedToaster } from "@/components/theme/themed-toaster";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [session, categories, cart] = await Promise.all([auth(), getShopCategories(), getCart()]);

  return (
    <CartProvider initialCart={cart} userId={session?.user?.id ?? null}>
      <div className="flex min-h-dvh flex-col">
        <Header categories={categories} isLoggedIn={Boolean(session?.user)} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CartDrawer />
      <BackToTop />
      <ThemedToaster />
    </CartProvider>
  );
}
