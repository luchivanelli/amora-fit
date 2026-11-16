import Link from "next/link";
import { Instagram, MessageCircle, Mail } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { WaveDivider } from "@/components/decor/wave-divider";
import { Sparkle } from "@/components/decor/sparkle";

export function Footer() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20">
      <WaveDivider className="text-sand/60" />
      <div className="relative overflow-hidden bg-sand/60">
        {/* Marca gigante de fondo */}
        <p aria-hidden className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[9rem] font-bold leading-none tracking-[0.1em] text-brand-200/50 sm:text-[14rem] lg:text-[18rem]">
          AMORA
        </p>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Wordmark size="lg" />
            <p className="mt-4 max-w-xs text-[15px] text-ink-soft">
              Ropa íntima y deportiva pensada para que te sientas cómoda, segura y vos misma, todos los días.
            </p>
            <div className="mt-5 flex gap-2">
              {wa && (
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#25D366]" aria-label="WhatsApp">
                  <MessageCircle className="size-5" />
                </a>
              )}
              <a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com"} target="_blank" rel="noopener noreferrer" className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:text-blush-deep" aria-label="Instagram">
                <Instagram className="size-5" />
              </a>
              <Link href="/contacto" className="flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:text-brand-700" aria-label="Contacto">
                <Mail className="size-5" />
              </Link>
            </div>
          </div>

          <FooterColumn
            title="Tienda"
            links={[
              ["/tienda", "Todos los productos"],
              ["/tienda?categoria=ropa-intima", "Ropa íntima"],
              ["/tienda?categoria=ropa-deportiva", "Ropa deportiva"],
              ["/tienda?orden=novedades", "Nuevos ingresos"],
            ]}
          />
          <FooterColumn
            title="Ayuda"
            links={[
              ["/preguntas-frecuentes", "Preguntas frecuentes"],
              ["/cambios-y-devoluciones", "Cambios y devoluciones"],
              ["/contacto", "Contacto"],
              ["/cuenta/pedidos", "Seguir mi pedido"],
            ]}
          />
          <FooterColumn
            title="AMORA"
            links={[
              ["/terminos", "Términos y condiciones"],
              ["/privacidad", "Privacidad"],
            ]}
          />
        </div>

        <div className="relative border-t border-sand-dark/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-ink-muted sm:flex-row sm:px-6 lg:px-8">
            <p className="inline-flex items-center gap-1.5">
              © {year} AMORA · Hecho con cariño, pensando en vos <Sparkle className="size-3 text-blush" />
            </p>
            <ThemeToggle label className="h-10 text-sm text-ink-soft" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink">
        <Sparkle className="size-2.5 text-blush" /> {title}
      </p>
      <ul className="flex flex-col gap-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="link-underline text-[15px] text-ink-soft transition-colors hover:text-brand-700">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
