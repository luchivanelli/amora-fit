import { Truck, RefreshCcw, CreditCard, HeartHandshake } from "lucide-react";
import { RevealOnScroll } from "@/components/motion/reveal-on-scroll";
import { WaveDivider } from "@/components/decor/wave-divider";
import { Eyebrow } from "@/components/decor/sparkle";

const ITEMS = [
  { icon: Truck, title: "Envíos gratis", text: "Coordinamos el envío dentro de Villa Constitución y te lo llevamos.", tone: "bg-brand-100 text-brand-700" },
  { icon: RefreshCcw, title: "Cambios sin vueltas", text: "Tenés 30 días para cambiar el talle o el modelo, sin cargo.", tone: "bg-blush-soft text-blush-deep" },
  { icon: CreditCard, title: "Pagá como prefieras", text: "Efectivo, transferencia o lo acordamos juntas. Proximamente Mercado Pago", tone: "bg-info-soft text-info" },
  { icon: HeartHandshake, title: "Pensado para vos", text: "Talles reales, telas suaves y atención cercana por WhatsApp.", tone: "bg-warn-soft text-warn" },
];

export function Benefits() {
  return (
    <section className="relative" aria-labelledby="benefits-title">
      <WaveDivider className="text-sand/60" />
      <div className="bg-sand/60">
        <RevealOnScroll stagger="[data-item]" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Eyebrow className="justify-center">Comprar en AMORA</Eyebrow>
            <h2 id="benefits-title" className="mt-3 text-3xl font-medium sm:text-4xl">
              Simple, cercano y sin letra chica
            </h2>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ITEMS.map(({ icon: Icon, title, text, tone }) => (
              <li key={title} data-item className="lift group flex flex-col gap-4 rounded-3xl border border-sand-dark/60 bg-surface p-6">
                <span className={`flex size-14 items-center justify-center rounded-[40%_60%_55%_45%/50%_45%_55%_50%] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 ${tone}`}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-sans text-lg font-semibold">{title}</p>
                  <p className="mt-1 text-[15px] text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
      <WaveDivider flip className="text-sand/60" />
    </section>
  );
}
