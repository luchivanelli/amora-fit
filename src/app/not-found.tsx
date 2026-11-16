import { LinkButton } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Blob } from "@/components/decor/blob";
import { Sparkle } from "@/components/decor/sparkle";

/** 404 para rutas que no existen (fuera de la tienda y del panel). */
export default function RootNotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-cream px-4 py-16 text-center">
      <Blob tone="blush" blur className="-left-24 top-10 size-96 opacity-70" />
      <Blob tone="brand" shape={1} blur className="-right-32 bottom-0 size-[28rem] opacity-70" />
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="relative mb-10">
        <Wordmark size="lg" />
      </div>
      <div className="relative">
        <p className="text-gradient font-display text-[9rem] font-bold leading-none sm:text-[12rem]">404</p>
        <Sparkle className="absolute -right-4 top-6 size-8 text-blush" pulse />
        <Sparkle className="absolute -left-6 bottom-10 size-4 text-brand-400" pulse />
      </div>
      <h1 className="relative mt-2 text-4xl font-medium">Esa página no existe</h1>
      <p className="relative mt-3 max-w-md text-lg text-ink-soft">Puede que el link esté mal escrito o que la página ya no esté. Pero hay mucho más para ver.</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/tienda">Ir a la tienda</LinkButton>
        <LinkButton href="/" variant="secondary">Volver al inicio</LinkButton>
      </div>
    </main>
  );
}
