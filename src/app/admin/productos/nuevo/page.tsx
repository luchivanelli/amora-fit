import type { Metadata } from "next";
import { CreateDraftOnMount } from "@/components/admin/products/create-draft-on-mount";

export const metadata: Metadata = { title: "Nuevo producto" };

/**
 * "+ Agregar producto" crea un borrador vacío y abre el formulario.
 * Se hace desde el cliente (no al cargar la página) para que un prefetch
 * nunca cree borradores de más.
 */
export default function NewProductPage() {
  return <CreateDraftOnMount />;
}
