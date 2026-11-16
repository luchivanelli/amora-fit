import { LinkButton } from "@/components/ui/button";
import { Blob } from "@/components/decor/blob";
import { Sparkle } from "@/components/decor/sparkle";

export default function ShopNotFound() {
  return (
    <div className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden px-4 py-24 text-center sm:px-6">
      <Blob tone="blush" blur className="-left-20 top-0 size-80 opacity-70" />
      <Blob tone="brand" shape={1} blur className="-right-24 bottom-0 size-96 opacity-70" />
      <div className="relative">
        <p className="text-gradient font-display text-[9rem] font-bold leading-none sm:text-[12rem]">404</p>
        <Sparkle className="absolute -right-4 top-6 size-8 text-blush" pulse />
        <Sparkle className="absolute -left-6 bottom-10 size-4 text-brand-400" pulse />
      </div>
      <h1 className="relative mt-2 text-4xl font-medium">Esa página no existe</h1>
      <p className="relative mt-3 text-lg text-ink-soft">Puede que el producto ya no esté o que el link esté mal escrito. Pero hay mucho más para ver.</p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/tienda">Ir a la tienda</LinkButton>
        <LinkButton href="/" variant="secondary">Volver al inicio</LinkButton>
      </div>
    </div>
  );
}
