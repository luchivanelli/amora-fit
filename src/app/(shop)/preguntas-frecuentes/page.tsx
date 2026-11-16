import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Preguntas frecuentes", description: "Talles, envíos, pagos y cambios: todo lo que necesitás saber antes de comprar en AMORA." };

const FAQ = [
  { q: "¿Cómo elijo mi talle?", a: "En cada producto tenés el botón “Guía de talles” con medidas en centímetros. Si estás entre dos talles, elegí el más grande: nuestras prendas son elásticas pero priorizamos la comodidad. Y si tenés dudas, escribinos por WhatsApp con tus medidas y te recomendamos." },
  { q: "¿Hacen envíos?", a: "Por ahora hacemos envíos gratis dentro de Villa Constitución. Cuando confirmás tu pedido, coordinamos juntas el día y el horario de entrega por WhatsApp. Todavía no hacemos envíos al resto del país." },
  { q: "¿Qué formas de pago aceptan?", a: "Por ahora acordamos el pago directamente con vos: transferencia bancaria o efectivo. Próximamente vas a poder pagar también con Mercado Pago." },
  { q: "¿Qué pasa cuando elijo “Acordar con la vendedora”?", a: "Tu pedido queda reservado y en la pantalla de confirmación ves el resumen. Nos escribís por WhatsApp (o te escribimos nosotras) para coordinar el pago y la entrega. El stock queda guardado para vos." },
  { q: "¿Puedo cambiar una prenda?", a: "Sí, dentro de los 30 días de recibida, sin uso y con etiquetas. Por higiene, la ropa íntima solo se cambia si no se probó sobre la piel. Mirá la sección de cambios y devoluciones para el paso a paso." },
  { q: "¿Cómo sigo mi pedido?", a: "Si creaste una cuenta, en “Mis pedidos” ves el estado actualizado. Si compraste sin cuenta, entrá a “Seguir mi pedido” (abajo de todo en la página) con el mail y el teléfono que usaste al comprar." },
  { q: "¿Cómo cuido las prendas?", a: "Lavado a mano o en ciclo delicado con agua fría, sin suavizante ni lavandina. Secado a la sombra, sin secarropas. Así duran mucho más." },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <StaticPage title="Preguntas frecuentes" intro="Las dudas que más nos llegan, respondidas.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="divide-y divide-sand rounded-2xl border border-sand-dark/70 bg-surface px-5">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="cursor-pointer font-sans text-[15px] font-semibold text-ink marker:content-none">{f.q}</summary>
            <p className="mt-2">{f.a}</p>
          </details>
        ))}
      </div>
      <p>¿No encontraste lo que buscabas? <a href="/contacto">Escribinos</a>.</p>
    </StaticPage>
  );
}
