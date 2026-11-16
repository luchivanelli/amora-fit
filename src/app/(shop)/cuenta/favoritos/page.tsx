import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getFavoriteProducts } from "@/server/queries/shop/products";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mis favoritos", robots: { index: false } };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar?callbackUrl=/cuenta/favoritos");
  const products = await getFavoriteProducts(session.user.id);

  if (products.length === 0) {
    return <EmptyState icon={<Heart className="size-7" />} title="Todavía no tenés favoritos" description="Tocá el corazón de los productos que te gusten para encontrarlos después." action={<LinkButton href="/tienda">Explorar la tienda</LinkButton>} />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isFavorite />
      ))}
    </div>
  );
}
