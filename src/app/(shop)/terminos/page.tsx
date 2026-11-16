import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <StaticPage title="Términos y condiciones" intro="Las reglas claras para comprar tranquila.">
      <h2>Compras</h2>
      <p>Al confirmar un pedido en la tienda aceptás estos términos. Los precios están expresados en pesos argentinos e incluyen IVA. Nos reservamos el derecho de modificar precios sin aviso previo; el precio válido es el que figura al momento de confirmar el pedido.</p>
      <h2>Stock y confirmación</h2>
      <p>Al confirmar un pedido, el stock queda reservado. Los pedidos “a acordar con la vendedora” se mantienen reservados hasta coordinar el pago; si no hay respuesta en 5 días hábiles podemos cancelarlos.</p>
      <h2>Pagos</h2>
      <p>Por el momento, el pago se acuerda directamente con nosotras (transferencia o efectivo). Próximamente sumaremos Mercado Pago. No almacenamos datos de tarjetas.</p>
      <h2>Envíos</h2>
      <p>Por el momento solo hacemos envíos dentro de Villa Constitución, sin costo. El día y el horario de entrega se coordinan por WhatsApp una vez confirmado el pedido.</p>
      <h2>Cambios y devoluciones</h2>
      <p>Ver la sección de <a href="/cambios-y-devoluciones">cambios y devoluciones</a>.</p>
      <h2>Contacto</h2>
      <p>Para cualquier consulta sobre estos términos, escribinos desde <a href="/contacto">contacto</a>.</p>
    </StaticPage>
  );
}
