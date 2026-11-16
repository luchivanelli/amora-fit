import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MessageCircle, Mail, Instagram, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = { title: "Contacto", description: "Escribinos por WhatsApp, Instagram o mail. Te ayudamos a elegir tu talle y resolvemos tus dudas." };

function ContactCard({ href, external, icon, iconClass, title, text, cta }: { href: string; external?: boolean; icon: ReactNode; iconClass: string; title: string; text: string; cta: string }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex flex-col gap-4 rounded-2xl border border-sand-dark/70 bg-surface p-5 transition-colors hover:border-brand-400"
    >
      <span className={`flex size-12 items-center justify-center rounded-full ${iconClass}`}>{icon}</span>
      <span className="flex-1">
        <span className="block font-sans text-lg font-semibold">{title}</span>
        <span className="mt-1 block text-[15px] text-ink-soft">{text}</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[15px] font-medium text-brand-700 group-hover:underline">
        {cta} <ArrowUpRight className="size-4" aria-hidden />
      </span>
    </a>
  );
}

export default function ContactPage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const email = process.env.CONTACT_EMAIL || process.env.SELLER_EMAIL;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-medium sm:text-5xl">Hablemos</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-soft">¿Dudas con un talle, un pedido o un cambio? Estamos para ayudarte.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {wa && (
          <ContactCard
            href={`https://wa.me/${wa}`}
            external
            icon={<MessageCircle className="size-6" aria-hidden />}
            iconClass="bg-[#25D366]/15 text-[#128C7E]"
            title="WhatsApp"
            text="La forma más rápida. Respondemos en el día."
            cta="Escribinos"
          />
        )}
        {instagram && (
          <ContactCard
            href={instagram}
            external
            icon={<Instagram className="size-6" aria-hidden />}
            iconClass="bg-[#E1306C]/15 text-[#C13584]"
            title="Instagram"
            text="Mirá las novedades y mandanos un mensaje directo."
            cta="Seguinos"
          />
        )}
        {email && (
          <ContactCard
            href={`mailto:${email}?subject=${encodeURIComponent("Consulta desde la tienda")}`}
            icon={<Mail className="size-6" aria-hidden />}
            iconClass="bg-brand-100 text-brand-700"
            title="Mail"
            text={`Escribinos a ${email} y te respondemos a la brevedad.`}
            cta="Enviar mail"
          />
        )}
      </div>
    </div>
  );
}
