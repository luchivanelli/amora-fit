import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Blob } from "@/components/decor/blob";
import { Sparkle } from "@/components/decor/sparkle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh bg-cream lg:grid-cols-[1fr_1.1fr]">
      {/* Panel ilustrado (solo escritorio) */}
      <aside className="relative hidden overflow-hidden bg-brand-600 lg:block" aria-hidden>
        {/* Formas suaves para que el verde no quede plano. */}
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-black/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6dac3]">
            <Sparkle className="size-3 text-[#f2c4b8]" /> AMORA
          </p>
          <p className="mt-3 max-w-md font-display text-4xl font-medium leading-tight xl:text-5xl">
            Cómoda con vos, <em className="italic text-[#d6dac3]">todos</em> los días.
          </p>
        </div>
      </aside>

      {/* Formulario */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10">
        <Blob tone="brand" blur className="-right-32 -top-32 size-96 opacity-70" />
        <Blob tone="blush" shape={2} blur className="-bottom-32 -left-24 size-80 opacity-60" />
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="relative mb-8">
          <Wordmark size="lg" />
        </div>
        <div className="relative w-full max-w-md rounded-4xl border border-sand-dark/70 bg-surface p-6 shadow-soft sm:p-8">{children}</div>
      </div>
    </main>
  );
}
