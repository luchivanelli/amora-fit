import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Política de privacidad" intro="Tus datos son tuyos. Acá te contamos qué guardamos y para qué.">
      <h2>Qué datos recopilamos</h2>
      <ul>
        <li>Datos de contacto y entrega que cargás al comprar: nombre, teléfono, mail y dirección o zona.</li>
        <li>Si creás una cuenta: tu mail, nombre, teléfono, direcciones guardadas, pedidos y favoritos.</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Procesar y entregar tus pedidos, y avisarte sobre su estado.</li>
        <li>Responder tus consultas.</li>
      </ul>
      <h2>Con quién los compartimos</h2>
      <p>Solo con los servicios necesarios para operar la tienda: el servicio donde está alojada la tienda y, cuando lo habilitemos, Mercado Pago (pagos). Nunca vendemos ni cedemos tus datos a terceros con fines publicitarios.</p>
      <h2>Seguridad</h2>
      <p>Tu contraseña se guarda cifrada y toda la comunicación con la tienda viaja por HTTPS. No almacenamos datos de tarjetas.</p>
      <h2>Tus derechos</h2>
      <p>Podés pedirnos ver, corregir o eliminar tus datos escribiendo desde <a href="/contacto">contacto</a>. Conforme a la Ley 25.326 de Protección de Datos Personales, la Agencia de Acceso a la Información Pública tiene la atribución de atender denuncias y reclamos.</p>
      <h2>Cookies</h2>
      <p>Usamos una cookie para recordar tu carrito y otra para mantener tu sesión si iniciás sesión. No usamos cookies de seguimiento publicitario.</p>
    </StaticPage>
  );
}
