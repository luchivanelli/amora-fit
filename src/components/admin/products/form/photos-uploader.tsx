"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2, Star, Trash2, GripVertical, ImagePlus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  addProductImage,
  deleteProductImage,
  getUploadSignature,
  reorderProductImages,
  setMainProductImage,
  setProductImageColor,
  type ImageDTO,
} from "@/server/actions/admin/images";
import { Swatch } from "@/components/ui/swatch";

type Color = { name: string; hex?: string | null };

type Props = {
  productId: string;
  images: ImageDTO[];
  /** Colores del producto: permiten indicar a cuál pertenece cada foto. */
  colors?: Color[];
  onChange: (images: ImageDTO[]) => void;
  error?: string;
};

type Uploading = { id: string; name: string; preview: string; status: "comprimiendo" | "subiendo" | "error"; message?: string };

const MAX_IMAGES = 10;

export function PhotosUploader({ productId, images, colors = [], onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [toDelete, setToDelete] = useState<ImageDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateUploading = (id: string, patch: Partial<Uploading>) =>
    setUploading((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const uploadOne = useCallback(
    async (file: File) => {
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const preview = URL.createObjectURL(file);
      setUploading((list) => [...list, { id: tempId, name: file.name, preview, status: "comprimiendo" }]);

      try {
        const compressed = await compressImage(file);
        updateUploading(tempId, { status: "subiendo" });

        const sig = await getUploadSignature(productId);
        if (!sig.ok) throw new Error(sig.error);

        const body = new FormData();
        body.append("file", compressed);
        body.append("api_key", sig.data.apiKey);
        body.append("timestamp", String(sig.data.timestamp));
        body.append("signature", sig.data.signature);
        body.append("folder", sig.data.folder);

        const res = await fetch(sig.data.uploadUrl, { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { secure_url?: string; public_id?: string; error?: { message?: string } };
        if (!res.ok || !json.secure_url || !json.public_id) {
          console.error("Cloudinary respondió:", res.status, json);
          throw new Error(json.error?.message ? `Cloudinary: ${json.error.message}` : "No se pudo subir la foto. Revisá tu conexión y probá de nuevo.");
        }

        const saved = await addProductImage({ productId, url: json.secure_url, publicId: json.public_id });
        if (!saved.ok) throw new Error(saved.error);

        onChange([...imagesRef.current, saved.data]);
        setUploading((list) => list.filter((u) => u.id !== tempId));
        URL.revokeObjectURL(preview);
      } catch (e) {
        const message = e instanceof Error ? e.message : "No se pudo subir la foto.";
        updateUploading(tempId, { status: "error", message });
        toast.error(message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId],
  );

  // Referencia siempre actualizada para subir varias fotos en paralelo sin pisarse.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) { toast.error("Elegí archivos de imagen (JPG, PNG…)."); return; }
    const room = MAX_IMAGES - images.length - uploading.length;
    if (room <= 0) { toast.error(`Podés subir hasta ${MAX_IMAGES} fotos por producto.`); return; }
    if (list.length > room) toast.info(`Se suben las primeras ${room} fotos (máximo ${MAX_IMAGES} por producto).`);
    list.slice(0, room).forEach((f) => void uploadOne(f));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = images.findIndex((i) => i.id === active.id);
    const to = images.findIndex((i) => i.id === over.id);
    const next = arrayMove(images, from, to).map((img, position) => ({ ...img, position }));
    const previous = images;
    onChange(next);
    void reorderProductImages(productId, next.map((i) => i.id)).then((res) => {
      if (!res.ok) {
        onChange(previous);
        toast.error(res.error);
      }
    });
  };

  const makeMain = (img: ImageDTO) => {
    const previous = images;
    onChange(images.map((i) => ({ ...i, isMain: i.id === img.id })));
    void setMainProductImage(productId, img.id).then((res) => {
      if (!res.ok) {
        onChange(previous);
        toast.error(res.error);
      } else toast.success("Esa es ahora la foto principal.");
    });
  };

  const setColor = (img: ImageDTO, color: string | null) => {
    const previous = images;
    onChange(images.map((i) => (i.id === img.id ? { ...i, color } : i)));
    void setProductImageColor(productId, img.id, color).then((res) => {
      if (!res.ok) {
        onChange(previous);
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deleteProductImage(productId, toDelete.id);
    setDeleting(false);
    if (!res.ok) { toast.error(res.error); return; }
    const rest = images.filter((i) => i.id !== toDelete.id);
    const hadMain = toDelete.isMain;
    onChange(rest.map((i, position) => ({ ...i, position, isMain: hadMain ? position === 0 : i.isMain })));
    setToDelete(null);
    toast.success("Foto eliminada.");
  };

  const total = images.length + uploading.length;

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        disabled={total >= MAX_IMAGES}
        className={cn(
          "flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors disabled:opacity-50",
          dragOver ? "border-brand-500 bg-brand-50" : error ? "border-danger bg-danger-soft/40" : "border-sand-dark bg-sand/30 hover:border-brand-400 hover:bg-brand-50/60",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface text-brand-700 shadow-sm">
          <Camera className="size-6" aria-hidden />
        </span>
        <span className="text-[15px] font-medium text-ink">Tocá para subir fotos</span>
        <span className="text-sm text-ink-muted">Desde la galería o la cámara · hasta {MAX_IMAGES} fotos</span>
      </button>
      {error && (
        <p className="-mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {(images.length > 0 || uploading.length > 0) && (
        <>
          <p className="text-sm text-ink-muted">
            Mantené apretada una foto y arrastrala para cambiar el orden. La estrella marca la foto principal.
            {colors.length > 0 && " Debajo de cada foto podés indicar de qué color es: en la tienda se muestra cuando la clienta elige ese color."}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {images.map((img, index) => (
                  <SortableImage
                    key={img.id}
                    image={img}
                    index={index}
                    colors={colors}
                    onMakeMain={() => makeMain(img)}
                    onDelete={() => setToDelete(img)}
                    onColorChange={(color) => setColor(img, color)}
                  />
                ))}
                {uploading.map((u) => (
                  <li key={u.id} className="relative aspect-square overflow-hidden rounded-xl bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.preview} alt="" className="size-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-paper/60 text-xs font-medium text-[#2b2a26]">
                      {u.status === "error" ? (
                        <button type="button" onClick={() => setUploading((l) => l.filter((x) => x.id !== u.id))} className="rounded-lg bg-red-600 px-2 py-1 text-white">
                          Quitar
                        </button>
                      ) : (
                        <>
                          <Loader2 className="size-5 animate-spin text-brand-700" aria-hidden />
                          {u.status === "comprimiendo" ? "Preparando…" : "Subiendo…"}
                        </>
                      )}
                    </div>
                  </li>
                ))}
                {total < MAX_IMAGES && (
                  <li>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand-dark text-sm text-ink-soft hover:border-brand-400 hover:bg-brand-50/60"
                    >
                      <ImagePlus className="size-6" aria-hidden />
                      Agregar
                    </button>
                  </li>
                )}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="¿Eliminar esta foto?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        destructive
        loading={deleting}
      />
    </div>
  );
}

function SortableImage({
  image,
  index,
  colors,
  onMakeMain,
  onDelete,
  onColorChange,
}: {
  image: ImageDTO;
  index: number;
  colors: Color[];
  onMakeMain: () => void;
  onDelete: () => void;
  onColorChange: (color: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const current = image.color && colors.some((c) => c.name === image.color) ? image.color : "";
  const currentHex = colors.find((c) => c.name === current)?.hex ?? null;

  return (
    <li ref={setNodeRef} style={style} className={cn("flex flex-col gap-1.5", isDragging && "z-10 opacity-80")}>
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl bg-sand ring-2 ring-transparent",
        image.isMain && "ring-brand-600",
        isDragging && "shadow-xl",
      )}
    >
      <Image src={image.url} alt={`Foto ${index + 1}`} fill sizes="(max-width: 640px) 33vw, 160px" className="object-cover" />

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 flex size-8 cursor-grab touch-none items-center justify-center rounded-lg bg-surface/90 text-ink-soft shadow active:cursor-grabbing"
        aria-label={`Mover foto ${index + 1}`}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-lg bg-surface/90 text-danger shadow hover:bg-danger-soft"
        aria-label={`Eliminar foto ${index + 1}`}
      >
        <Trash2 className="size-4" />
      </button>

      <button
        type="button"
        onClick={onMakeMain}
        className={cn(
          "absolute inset-x-1 bottom-1 flex h-8 items-center justify-center gap-1 rounded-lg text-xs font-semibold shadow",
          image.isMain ? "bg-brand-600 text-white" : "bg-surface/90 text-ink hover:bg-surface",
        )}
        aria-pressed={image.isMain}
      >
        <Star className={cn("size-3.5", image.isMain && "fill-current")} aria-hidden />
        {image.isMain ? "Principal" : "Hacer principal"}
      </button>
    </div>

      {colors.length > 0 && (
        <label className="flex items-center gap-1.5">
          <Swatch hex={currentHex} className={cn("size-3.5", !current && "opacity-40")} />
          <select
            value={current}
            onChange={(e) => onColorChange(e.target.value || null)}
            aria-label={`Color de la foto ${index + 1}`}
            className="h-9 min-w-0 flex-1 rounded-lg border border-sand-dark bg-surface px-2 text-xs text-ink"
          >
            <option value="">Todos los colores</option>
            {colors.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </li>
  );
}
