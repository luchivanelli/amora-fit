import { Suspense } from "react";
import Link from "next/link";
import { Heart, User } from "lucide-react";
import type { ShopCategory } from "@/server/queries/shop/categories";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { CartButton } from "@/components/layout/cart-button";
import { SearchButton } from "@/components/layout/search-button";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { HeaderBar } from "@/components/layout/header-bar";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Header({ categories, isLoggedIn }: { categories: ShopCategory[]; isLoggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40">
      {/* Alto total del header: 2rem + 4rem = 6rem. El hero del home resta ese valor. */}
      <AnnouncementBar />
      <HeaderBar>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 lg:gap-10">
            <MobileNav categories={categories} isLoggedIn={isLoggedIn} />
            <Wordmark />
            <Suspense fallback={null}>
              <DesktopNav categories={categories} />
            </Suspense>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-0.5">
            <SearchButton categories={categories} />
            {/* El toggle lleva `inline-flex` propio y `cn` no hace merge, así que la visibilidad va en el wrapper. */}
            <div className="hidden lg:flex">
              <ThemeToggle />
            </div>
            <Link href="/cuenta/favoritos" className="hidden size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand sm:flex" aria-label="Favoritos">
              <Heart className="size-5" />
            </Link>
            <Link href={isLoggedIn ? "/cuenta" : "/ingresar"} className="hidden size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand sm:flex" aria-label={isLoggedIn ? "Mi cuenta" : "Ingresar"}>
              <User className="size-5" />
            </Link>
            <CartButton />
          </div>
        </div>
      </HeaderBar>
    </header>
  );
}
