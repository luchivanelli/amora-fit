"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Send, Save, AlertCircle } from "lucide-react";
import type { ProductFormValues } from "@/lib/validations/admin/product";
import type { ProductFormDTO } from "@/server/queries/admin/products";
import type { CategoryOption } from "@/server/queries/admin/categories";
import type { ImageDTO } from "@/server/actions/admin/images";
import { saveProduct } from "@/server/actions/admin/products";
import { discountPercent, formatMoney, cn } from "@/lib/utils";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/field";
import { Button, LinkButton } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SaveFeedback } from "@/components/motion/save-feedback";
import { PhotosUploader } from "@/components/admin/products/form/photos-uploader";
import { VariantsBuilder } from "@/components/admin/products/form/variants-builder";
import { useUnsavedGuard } from "@/components/admin/products/form/use-unsaved-guard";

type Props = { product: ProductFormDTO; categories: CategoryOption[] };

type SaveState = "idle" | "saving" | "saved" | "error" | "dirty";

const AUTOSAVE_MS = 2500;
const backupKey = (id: string) => `amora:borrador:${id}`;

function toValues(p: ProductFormDTO): ProductFormValues {
  return {
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    price: p.price && p.price > 0 ? p.price : null,
    compareAtPrice: p.compareAtPrice,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    sizes: p.sizes,
    colors: p.colors,
    stock: p.stock,
  };
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(() => toValues(product));
  const [images, setImages] = useState<ImageDTO[]>(product.images);
  const [status, setStatus] = useState(product.status);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDraft, setConfirmDraft] = useState(false);
  const [busy, setBusy] = useState<null | "draft" | "publish">(null);

  const dirty = saveState === "dirty" || saveState === "error";
  useUnsavedGuard(dirty);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const savingRef = useRef(false);

  const update = useCallback((patch: Partial<ProductFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setSaveState("dirty");
    setFieldErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  }, []);

  /** Guarda en el servidor. Devuelve true si salió bien. */
  const persist = useCallback(
    async (mode: "autosave" | "draft" | "publish") => {
      if (savingRef.current) return false;
      savingRef.current = true;
      setSaveState("saving");
      const res = await saveProduct(product.id, valuesRef.current, mode);
      savingRef.current = false;

      if (!res.ok) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
          setSaveState(mode === "autosave" ? "dirty" : "error");
          if (mode !== "autosave") {
            const first = Object.keys(res.fieldErrors)[0];
            document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            toast.error("Faltan completar algunos datos. Los marcamos en rojo.");
          }
        } else {
          setSaveState("error");
          toast.error(res.error);
        }
        return false;
      }

      setStatus(res.data.status);
      setSavedAt(Date.now());
      setSaveState("saved");
      setFieldErrors({});
      try {
        localStorage.removeItem(backupKey(product.id));
      } catch {}
      return true;
    },
    [product.id],
  );

  // Autoguardado: unos segundos después del último cambio.
  useEffect(() => {
    if (saveState !== "dirty") return;
    const t = setTimeout(() => void persist("autosave"), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [values, saveState, persist]);

  // Copia local por si se corta internet.
  useEffect(() => {
    if (saveState !== "dirty") return;
    try {
      localStorage.setItem(backupKey(product.id), JSON.stringify({ values, at: Date.now() }));
    } catch {}
  }, [values, saveState, product.id]);

  // Al abrir: ofrecer recuperar si hay una copia local más nueva que lo guardado.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(backupKey(product.id));
      if (!raw) return;
      const backup = JSON.parse(raw) as { values: ProductFormValues; at: number };
      if (backup.at <= new Date(product.updatedAt).getTime()) {
        localStorage.removeItem(backupKey(product.id));
        return;
      }
      toast("Encontramos cambios que no llegaron a guardarse.", {
        duration: 12000,
        action: {
          label: "Recuperar",
          onClick: () => {
            setValues(backup.values);
            setSaveState("dirty");
          },
        },
        cancel: { label: "Descartar", onClick: () => localStorage.removeItem(backupKey(product.id)) },
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un producto nuevo (o un borrador) vuelve al listado al terminar; editar uno publicado se queda en el formulario.
  const publish = async () => {
    const wasPublished = status === "ACTIVE";
    setBusy("publish");
    const ok = await persist("publish");
    setBusy(null);
    if (ok) {
      toast.success(wasPublished ? "Cambios guardados. Ya se ven en la tienda." : "¡Publicado! Ya se ve en la tienda.");
      if (wasPublished) router.refresh();
      else router.push("/admin/productos");
    }
  };

  const saveDraft = async () => {
    const wasPublished = status === "ACTIVE";
    setConfirmDraft(false);
    setBusy("draft");
    const ok = await persist("draft");
    setBusy(null);
    if (ok) {
      toast.success(wasPublished ? "Listo, ya no se ve en la tienda." : "Borrador guardado.");
      if (wasPublished) router.refresh();
      else router.push("/admin/productos");
    }
  };

  const onDraftClick = () => {
    if (status === "ACTIVE") setConfirmDraft(true);
    else void saveDraft();
  };

  const isPublished = status === "ACTIVE";
  const pct = discountPercent(values.price, values.compareAtPrice);
  const roots = Array.from(new Set(categories.map((c) => c.group)));
  const errorCount = Object.keys(fieldErrors).length;

  const actions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:flex-col">
      <Button variant="secondary" onClick={onDraftClick} loading={busy === "draft"} disabled={busy !== null} fullWidth>
        {isPublished ? (
          <>
            <EyeOff className="size-5" aria-hidden /> Ocultar de la tienda
          </>
        ) : (
          <>
            <Save className="size-5" aria-hidden /> Guardar borrador
          </>
        )}
      </Button>
      <Button onClick={publish} loading={busy === "publish"} disabled={busy !== null} fullWidth>
        {isPublished ? (
          <>
            <Save className="size-5" aria-hidden /> Guardar cambios
          </>
        ) : (
          <>
            <Send className="size-5" aria-hidden /> Publicar
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="pb-28 lg:pb-0">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/productos" className="mb-2 inline-block text-[15px] text-ink-soft hover:text-ink">
            ‹ Productos
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-3xl font-medium sm:text-4xl">{values.name.trim() || "Nuevo producto"}</h1>
            <Badge tone={isPublished ? "success" : "neutral"}>{isPublished ? "Publicado" : "Borrador"}</Badge>
          </div>
        </div>
        <SaveFeedback status={saveState} savedAt={savedAt} />
      </div>

      {errorCount > 0 && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-danger-soft px-4 py-3 text-[15px] text-danger">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Faltan completar algunos datos para publicar:</p>
            <ul className="mt-1 list-disc pl-5">
              {Object.values(fieldErrors).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          {/* 1. Datos básicos */}
          <SectionCard step={1} title="Datos básicos" id="field-name">
            <div className="flex flex-col gap-5">
              <Field label="Nombre del producto" htmlFor="name" error={fieldErrors.name} help="Así lo van a ver tus clientas. Ejemplo: Conjunto Luna">
                <Input id="name" value={values.name} onChange={(e) => update({ name: e.target.value })} maxLength={120} error={Boolean(fieldErrors.name)} autoComplete="off" />
              </Field>
              <div id="field-description">
                <Field label="Descripción" htmlFor="description" error={fieldErrors.description} help="Contá de qué está hecho, cómo queda y para qué ocasión es. Podés usar saltos de línea.">
                  <Textarea id="description" value={values.description} onChange={(e) => update({ description: e.target.value })} maxLength={5000} rows={6} error={Boolean(fieldErrors.description)} />
                </Field>
              </div>
              <div id="field-categoryId">
                <Field label="Categoría" htmlFor="categoryId" error={fieldErrors.categoryId}>
                  <Select id="categoryId" value={values.categoryId ?? ""} onChange={(e) => update({ categoryId: e.target.value || null })} error={Boolean(fieldErrors.categoryId)}>
                    <option value="">Elegí una categoría…</option>
                    {roots.map((root) => (
                      <optgroup key={root} label={root}>
                        {categories
                          .filter((c) => c.group === root)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.isRoot ? c.label : `${root} › ${c.label}`}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* 2. Fotos */}
          <SectionCard step={2} title="Fotos" description="La primera o la marcada con estrella es la que se ve en el listado de la tienda." id="field-images">
            <PhotosUploader productId={product.id} images={images} colors={values.colors} onChange={(imgs) => { setImages(imgs); setFieldErrors((e) => { const n = { ...e }; delete n.images; return n; }); }} error={fieldErrors.images} />
          </SectionCard>

          {/* 3. Precio */}
          <SectionCard step={3} title="Precio" id="field-price">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Precio" htmlFor="price" error={fieldErrors.price}>
                <MoneyInput id="price" value={values.price} onChange={(v) => update({ price: v })} error={Boolean(fieldErrors.price)} placeholder="0" />
              </Field>
              <div id="field-compareAtPrice">
                <Field
                  label="Precio anterior"
                  htmlFor="compareAtPrice"
                  optional
                  error={fieldErrors.compareAtPrice}
                  help={pct ? `Se muestra tachado: ${pct}% de descuento` : "Si está en oferta, poné acá el precio viejo y se muestra tachado."}
                >
                  <MoneyInput id="compareAtPrice" value={values.compareAtPrice} onChange={(v) => update({ compareAtPrice: v })} error={Boolean(fieldErrors.compareAtPrice)} placeholder="0" />
                </Field>
              </div>
            </div>
            {values.price !== null && values.price > 0 && (
              <p className="mt-4 rounded-xl bg-sand/50 px-4 py-3 text-[15px]">
                En la tienda se ve:{" "}
                <strong>{formatMoney(values.price)}</strong>
                {pct && values.compareAtPrice && (
                  <>
                    {" "}
                    <span className="text-ink-muted line-through">{formatMoney(values.compareAtPrice)}</span>{" "}
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">-{pct}%</span>
                  </>
                )}
              </p>
            )}
          </SectionCard>

          {/* 4. Talles, colores y stock */}
          <SectionCard step={4} title="Talles, colores y stock" id="field-sizes">
            <div id="field-colors">
              <VariantsBuilder
                sizes={values.sizes}
                colors={values.colors}
                stock={values.stock}
                errors={{ sizes: fieldErrors.sizes, colors: fieldErrors.colors, stock: fieldErrors.stock }}
                onChange={(patch) => update(patch)}
              />
            </div>
          </SectionCard>

          {/* 5. Publicación (en celular va acá; en escritorio, en la columna derecha) */}
          <div className="lg:hidden">
            <PublishSection values={values} update={update} productId={product.id} isPublished={isPublished} />
          </div>
        </div>

        {/* Columna derecha en escritorio */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-4">
            <PublishSection values={values} update={update} productId={product.id} isPublished={isPublished} actions={actions} />
          </div>
        </aside>
      </div>

      {/* Barra fija inferior en celular */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-sand-dark/60 bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button variant="secondary" onClick={onDraftClick} loading={busy === "draft"} disabled={busy !== null} className="flex-1">
            {isPublished ? "Ocultar" : "Guardar borrador"}
          </Button>
          <Button onClick={publish} loading={busy === "publish"} disabled={busy !== null} className="flex-1">
            {isPublished ? "Guardar cambios" : "Publicar"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDraft}
        onClose={() => setConfirmDraft(false)}
        onConfirm={saveDraft}
        title="¿Ocultar este producto de la tienda?"
        description="Se guarda como borrador: tus clientas dejan de verlo hasta que lo vuelvas a publicar."
        confirmLabel="Sí, ocultar"
      />
    </div>
  );
}

function PublishSection({
  values,
  update,
  productId,
  isPublished,
  actions,
}: {
  values: ProductFormValues;
  update: (patch: Partial<ProductFormValues>) => void;
  productId: string;
  isPublished: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <SectionCard step={5} title="Publicación" className={cn(!actions && "")}>
      <div className="flex flex-col gap-5">
        <Switch checked={values.isFeatured} onChange={(v) => update({ isFeatured: v })} label="Destacado" description="Aparece en “Productos destacados”, en la portada de la tienda." />
        <Switch checked={values.isNew} onChange={(v) => update({ isNew: v })} label="Nuevo ingreso" description="Muestra la etiqueta “Nuevo” en la tienda." />
        <LinkButton href={`/admin/productos/${productId}/vista-previa`} variant="ghost" fullWidth>
          <Eye className="size-5" aria-hidden /> Ver cómo queda en la tienda
        </LinkButton>
        {actions && (
          <>
            <hr className="border-sand" />
            {actions}
            <p className="text-sm text-ink-muted">
              {isPublished ? "Los cambios se ven en la tienda al instante." : "Mientras sea borrador, nadie lo ve. Publicar lo muestra al instante."}
            </p>
          </>
        )}
      </div>
    </SectionCard>
  );
}
