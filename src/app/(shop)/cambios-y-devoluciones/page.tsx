import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Cambios y devoluciones", description: "Tenés 30 días para cambiar talle o modelo. Así funciona." };

export default function ReturnsPage() {
  return (
    <StaticPage title="Cambios y devoluciones" intro="Queremos que te quede perfecto. Si no, lo cambiamos sin vueltas.">
      <h2>Plazo</h2>
      <p>Tenés <strong>30 días corridos</strong> desde que recibís el pedido para pedir un cambio de talle o de modelo.</p>
      <h2>Condiciones</h2>
      <ul>
        <li>La prenda tiene que estar sin uso, sin lavar y con sus etiquetas.</li>
        <li>Por una cuestión de higiene, las bombachas y conjuntos solo se cambian si no se probaron sobre la piel (probalas sobre tu ropa interior).</li>
        <li>Los productos en oferta también se pueden cambiar.</li>
      </ul>
      <h2>Cómo hacerlo</h2>
      <ul>
        <li>Escribinos por WhatsApp o desde <a href="/contacto">contacto</a> con tu número de pedido y qué querés cambiar.</li>
        <li>Acordamos el día y la hora del cambio.</li>
        <li>Si es la primera devolución y el producto es devuelto dentro del plazo, no se cobra un costo adicional.</li>
      </ul>
      <h2>Devoluciones</h2>
      <p>Si el producto llegó con una falla, nos hacemos cargo de todo: lo reponemos o te devolvemos el dinero, como prefieras.</p>
    </StaticPage>
  );
}
