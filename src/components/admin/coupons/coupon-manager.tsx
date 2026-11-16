"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TicketPercent, Copy } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import type { CouponDTO, CouponStatus } from "@/server/queries/admin/coupons";
import { saveCoupon, setCouponActive, deleteCoupon } from "@/server/actions/admin/coupons";
import type { FieldErrors } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea, MoneyInput } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

const STATUS: Record<CouponStatus, { label: string; tone: "success" | "neutral" | "info" | "danger" | "warning" }> = {
  activo: { label: "Activo", tone: "success" },
  pausado: { label: "Pausado", tone: "neutral" },
  programado: { label: "Programado", tone: "info" },
  vencido: { label: "Vencido", tone: "danger" },
  agotado: { label: "Agotado", tone: "warning" },
};

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });

/** ISO → "YYYY-MM-DD" en hora local (para <input type="date">). */
function toDateInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → ISO al inicio o al final de ese día, en hora local. */
function fromDateInput(value: string, endOfDay: boolean) {
  if (!value) return null;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

function discountLabel(c: Pick<CouponDTO, "type" | "value">) {
  return c.type === "PERCENTAGE" ? `${c.value}% OFF` : `${formatMoney(c.value)} OFF`;
}

function conditions(c: CouponDTO) {
  const parts: string[] = [];
  if (c.minSubtotal) parts.push(`Compras desde ${formatMoney(c.minSubtotal)}`);
  if (c.startsAt) parts.push(`Desde el ${dateFmt.format(new Date(c.startsAt))}`);
  if (c.expiresAt) parts.push(`Hasta el ${dateFmt.format(new Date(c.expiresAt))}`);
  parts.push(c.maxUses ? `Usado ${c.usedCount} de ${c.maxUses} veces` : `Usado ${c.usedCount} ${c.usedCount === 1 ? "vez" : "veces"}`);
  return parts;
}

export function CouponManager({ coupons }: { coupons: CouponDTO[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CouponDTO | "new" | null>(null);
  const [toDelete, setToDelete] = useState<CouponDTO | null>(null);
  const [pending, start] = useTransition();

  const toggle = (c: CouponDTO, next: boolean) =>
    start(async () => {
      const res = await setCouponActive(c.id, next);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(next ? `Listo, ${c.code} está activo.` : `Listo, ${c.code} quedó pausado.`);
      router.refresh();
    });

  const remove = () => {
    if (!toDelete) return;
    start(async () => {
      const res = await deleteCoupon(toDelete.id);
      setToDelete(null);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Cupón eliminado.");
      router.refresh();
    });
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Código ${code} copiado.`);
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  return (
    <>
      {coupons.length === 0 ? (
        <EmptyState
          icon={<TicketPercent className="size-7" />}
          title="Todavía no hay cupones"
          description="Creá un código de descuento para compartir con tus clientas. Lo escriben al finalizar la compra."
          action={
            <Button size="lg" onClick={() => setEditing("new")}>
              <Plus className="size-5" aria-hidden /> Crear cupón
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setEditing("new")}>
              <Plus className="size-5" aria-hidden /> Crear cupón
            </Button>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {coupons.map((c) => (
              <li key={c.id} className={cn("flex flex-col gap-3 rounded-2xl border border-sand-dark/70 bg-surface p-4", c.status !== "activo" && "opacity-80")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => copy(c.code)}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-brand-400 bg-brand-50 px-2.5 py-1 font-mono text-base font-semibold tracking-wide text-brand-700 hover:bg-brand-100"
                      title="Copiar código"
                    >
                      {c.code} <Copy className="size-3.5" aria-hidden />
                    </button>
                    <p className="mt-2 text-lg font-semibold text-ink">{discountLabel(c)}</p>
                    {c.description && <p className="text-[15px] text-ink-soft">{c.description}</p>}
                  </div>
                  <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                </div>
                <ul className="flex flex-col gap-0.5 text-sm text-ink-muted">
                  {conditions(c).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-sand pt-3">
                  <Switch checked={c.isActive} onChange={(v) => toggle(c, v)} label={c.isActive ? "Activo" : "Pausado"} disabled={pending} />
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditing(c)} className="flex size-11 items-center justify-center rounded-xl text-ink-muted hover:bg-sand hover:text-ink" aria-label={`Editar ${c.code}`}>
                      <Pencil className="size-5" />
                    </button>
                    <button type="button" onClick={() => setToDelete(c)} className="flex size-11 items-center justify-center rounded-xl text-ink-muted hover:bg-danger-soft hover:text-danger" aria-label={`Eliminar ${c.code}`}>
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <CouponDialog
          key={editing === "new" ? "new" : editing.id}
          coupon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title={`¿Eliminar el cupón ${toDelete?.code ?? ""}?`}
        description="Las clientas ya no van a poder usarlo. Los pedidos que lo usaron no cambian. Si solo querés frenarlo por un tiempo, mejor pausalo."
        confirmLabel="Sí, eliminar"
        destructive
        loading={pending}
      />
    </>
  );
}

function CouponDialog({ coupon, onClose, onSaved }: { coupon: CouponDTO | null; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">(coupon?.type ?? "PERCENTAGE");
  const [value, setValue] = useState<number | null>(coupon?.value ?? null);
  const [minSubtotal, setMinSubtotal] = useState<number | null>(coupon?.minSubtotal ?? null);
  const [maxUses, setMaxUses] = useState(coupon?.maxUses ? String(coupon.maxUses) : "");
  const [startsAt, setStartsAt] = useState(toDateInput(coupon?.startsAt ?? null));
  const [expiresAt, setExpiresAt] = useState(toDateInput(coupon?.expiresAt ?? null));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveCoupon({
        id: coupon?.id ?? null,
        code,
        description: description.trim() || null,
        type,
        value: value as number,
        minSubtotal,
        maxUses: maxUses ? Number(maxUses) : null,
        startsAt: fromDateInput(startsAt, false),
        expiresAt: fromDateInput(expiresAt, true),
        isActive,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success(coupon ? "Cupón actualizado." : "Cupón creado.");
      onSaved();
    });
  };

  const typeBtn = (t: "PERCENTAGE" | "FIXED", label: string) => (
    <button
      type="button"
      onClick={() => setType(t)}
      aria-pressed={type === t}
      className={cn(
        "h-12 flex-1 rounded-xl border text-[15px] font-medium transition-colors",
        type === t ? "border-brand-600 bg-brand-50 text-brand-700" : "border-sand-dark text-ink-soft hover:bg-sand/60",
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open onClose={onClose} title={coupon ? `Editar ${coupon.code}` : "Nuevo cupón"} description="Las clientas escriben el código al finalizar la compra.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Código" htmlFor="c-code" help="Ej.: BIENVENIDA10. Sin espacios." error={errors.code}>
          <Input id="c-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} error={!!errors.code} autoComplete="off" maxLength={30} className="font-mono uppercase" />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-medium text-ink">Tipo de descuento</span>
          <div className="flex gap-2">
            {typeBtn("PERCENTAGE", "Porcentaje (%)")}
            {typeBtn("FIXED", "Monto fijo ($)")}
          </div>
        </div>

        <Field label={type === "PERCENTAGE" ? "Porcentaje de descuento" : "Monto de descuento"} htmlFor="c-value" error={errors.value}>
          {type === "PERCENTAGE" ? (
            <div className="relative">
              <Input
                id="c-value"
                inputMode="numeric"
                value={value === null ? "" : String(value)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  setValue(raw === "" ? null : Number(raw));
                }}
                error={!!errors.value}
                className="pr-10"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted">%</span>
            </div>
          ) : (
            <MoneyInput id="c-value" value={value} onChange={setValue} error={!!errors.value} />
          )}
        </Field>

        <Field label="Descripción" htmlFor="c-desc" optional help="Solo para vos, para acordarte de qué es." error={errors.description}>
          <Textarea id="c-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Compra mínima" htmlFor="c-min" optional error={errors.minSubtotal}>
            <MoneyInput id="c-min" value={minSubtotal} onChange={setMinSubtotal} error={!!errors.minSubtotal} />
          </Field>
          <Field label="Límite de usos" htmlFor="c-max" optional help="Vacío = sin límite." error={errors.maxUses}>
            <Input id="c-max" inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/[^\d]/g, ""))} error={!!errors.maxUses} />
          </Field>
          <Field label="Válido desde" htmlFor="c-start" optional error={errors.startsAt}>
            <Input id="c-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} error={!!errors.startsAt} />
          </Field>
          <Field label="Válido hasta" htmlFor="c-end" optional help="Incluye todo ese día." error={errors.expiresAt}>
            <Input id="c-end" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} error={!!errors.expiresAt} />
          </Field>
        </div>

        <Switch checked={isActive} onChange={setIsActive} label="Activo" description="Si lo pausás, nadie puede usarlo hasta que lo vuelvas a activar." />

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {coupon ? "Guardar cambios" : "Crear cupón"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
