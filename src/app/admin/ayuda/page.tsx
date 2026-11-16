import type { Metadata } from "next";
import { Camera, Shirt, Package, Tags, Boxes, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ReplayTourButton } from "@/components/admin/help/replay-tour-button";

export const metadata: Metadata = { title: "Ayuda" };

const GUIDES = [
  {
    icon: Shirt,
    title: "Cómo cargar un producto",
    steps: [
      "Tocá “+ Agregar producto”.",
      "Escribí el nombre, una descripción corta y elegí la categoría.",
      "Subí las fotos (podés sacarlas con la cámara). La estrella marca la principal.",
      "Poné el precio. Si está en oferta, cargá también el precio anterior.",
      "Elegí talles y colores: se arma sola una tabla para que completes cuántas unidades tenés.",
      "Tocá “Publicar”. ¡Listo! Ya se ve en la tienda.",
    ],
  },
  {
    icon: Boxes,
    title: "Cómo cambiar el stock",
    steps: [
      "En “Productos”, tocá el número de stock del producto.",
      "Ajustá la cantidad por talle y color con los botones + y −.",
      "Tocá “Guardar stock”. Se actualiza al instante.",
    ],
  },
  {
    icon: Camera,
    title: "Cómo cambiar o reordenar fotos",
    steps: [
      "Entrá al producto con “Editar”.",
      "Mantené apretada una foto y arrastrala para cambiar el orden.",
      "Tocá “Hacer principal” para elegir la foto de portada.",
      "Con el tachito la eliminás (te pedimos confirmación).",
    ],
  },
  {
    icon: Eye,
    title: "Ocultar un producto sin borrarlo",
    steps: [
      "En “Productos”, tocá los tres puntos del producto.",
      "Elegí “Ocultar de la tienda”. Pasa a borrador y nadie lo ve.",
      "Cuando quieras, elegí “Mostrar en la tienda”.",
    ],
  },
  {
    icon: Package,
    title: "Cómo manejar un pedido",
    steps: [
      "En “Pedidos” ves los nuevos arriba. Tocá uno para ver el detalle.",
      "Si es “a acordar”, tocá “Abrir WhatsApp” para escribirle al cliente con el resumen ya armado.",
      "Cuando te paguen, tocá “Marcar pago recibido”. Si cobrás envío, cargalo y se suma al total.",
      "Cambiá el estado a Preparando → Enviado → Entregado a medida que avanza.",
    ],
  },
  {
    icon: Tags,
    title: "Cómo ordenar las categorías",
    steps: [
      "En “Categorías”, arrastrá desde las rayitas para cambiar el orden.",
      "Tocá el lápiz para renombrar.",
      "“Agregar subcategoría” crea una dentro de una principal (ej: Ropa íntima › Conjuntos).",
    ],
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Ayuda" subtitle="Guías cortas para resolver lo más común." action={<ReplayTourButton />} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {GUIDES.map(({ icon: Icon, title, steps }) => (
          <Card key={title}>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="font-sans text-lg font-semibold">{title}</h2>
            </div>
            <ol className="flex flex-col gap-2 text-[15px] text-ink-soft">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-ink">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-center text-[15px] text-ink-muted">
        ¿Algo no funciona como esperabas? Escribile a quien instaló la tienda y contale qué estabas haciendo.
      </p>
    </div>
  );
}
