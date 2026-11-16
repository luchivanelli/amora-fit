"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Copy, Eye, EyeOff, Trash2, RotateCcw, ExternalLink } from "lucide-react";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { archiveProduct, duplicateProduct, restoreProduct, setProductVisibility } from "@/server/actions/admin/products";
import type { ProductListItem } from "@/server/queries/admin/products";

type Props = {
  product: ProductListItem;
  /** Estado optimista de visibilidad, manejado por la fila. */
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
};

export function ProductRowActions({ product, visible, onVisibilityChange }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const toggleVisibility = () => {
    const next = !visible;
    onVisibilityChange(next); // optimista
    setOpen(false);
    start(async () => {
      const res = await setProductVisibility(product.id, next);
      if (!res.ok) {
        onVisibilityChange(!next); // revertir
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Listo, el producto ya se ve en la tienda." : "Listo, el producto quedó oculto.");
      router.refresh();
    });
  };

  const duplicate = () => {
    setOpen(false);
    start(async () => {
      const res = await duplicateProduct(product.id);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Copia creada. Ahora podés editarla.");
      router.push(`/admin/productos/${res.data.id}`);
    });
  };

  const archive = () => {
    start(async () => {
      const res = await archiveProduct(product.id);
      setConfirmDelete(false);
      setOpen(false);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Producto eliminado. Podés recuperarlo desde el filtro “Eliminados”.");
      router.refresh();
    });
  };

  const restore = () => {
    setOpen(false);
    start(async () => {
      const res = await restoreProduct(product.id);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Producto recuperado como borrador.");
      router.refresh();
    });
  };

  const itemClass =
    "flex h-13 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-ink hover:bg-sand/70 disabled:opacity-50";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-xl text-ink-muted hover:bg-sand hover:text-ink"
        aria-label={`Más acciones para ${product.name}`}
        aria-haspopup="dialog"
      >
        <MoreHorizontal className="size-5" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={product.name} description="¿Qué querés hacer?">
        <div className="flex flex-col gap-1">
          {product.isArchived ? (
            <button type="button" className={itemClass} onClick={restore} disabled={pending}>
              <RotateCcw className="size-5 text-brand-700" aria-hidden /> Recuperar producto
            </button>
          ) : (
            <>
              <Link href={`/admin/productos/${product.id}`} className={itemClass}>
                <Pencil className="size-5 text-brand-700" aria-hidden /> Editar
              </Link>
              <Link href={`/admin/productos/${product.id}/vista-previa`} className={itemClass}>
                <ExternalLink className="size-5 text-brand-700" aria-hidden /> Ver cómo queda en la tienda
              </Link>
              <button type="button" className={itemClass} onClick={duplicate} disabled={pending}>
                <Copy className="size-5 text-brand-700" aria-hidden /> Duplicar
              </button>
              <button type="button" className={itemClass} onClick={toggleVisibility} disabled={pending}>
                {visible ? (
                  <>
                    <EyeOff className="size-5 text-brand-700" aria-hidden /> Ocultar de la tienda
                  </>
                ) : (
                  <>
                    <Eye className="size-5 text-brand-700" aria-hidden /> Mostrar en la tienda
                  </>
                )}
              </button>
              <button
                type="button"
                className={`${itemClass} text-danger hover:bg-danger-soft`}
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                <Trash2 className="size-5" aria-hidden /> Eliminar
              </button>
            </>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={archive}
        title="¿Seguro que querés eliminar este producto?"
        description="Va a desaparecer de la tienda y del listado. Si te arrepentís, podés recuperarlo desde el filtro “Eliminados”."
        confirmLabel="Sí, eliminar"
        destructive
        loading={pending}
      />
    </>
  );
}
