"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { deleteAddress, saveAddress, setDefaultAddress, type AddressInput } from "@/server/actions/account";
import { PROVINCES } from "@/lib/validations/shop";
import { Button } from "@/components/ui/button";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";

type Address = AddressInput & { id: string; isDefault: boolean };

const EMPTY: AddressInput = { fullName: "", phone: "", street: "", apartment: "", city: "", province: "", zip: "", notes: "", label: "Casa", isDefault: false };

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Address | null | "new">(null);
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Address | null>(null);
  const [pending, start] = useTransition();

  const openNew = () => { setForm(EMPTY); setErrors({}); setEditing("new"); };
  const openEdit = (a: Address) => { setForm({ ...a }); setErrors({}); setEditing(a); };
  const set = (k: keyof AddressInput, v: string | boolean) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveAddress(form, editing && editing !== "new" ? editing.id : undefined);
      if (!res.ok) { if (res.fieldErrors) setErrors(res.fieldErrors); toast.error(res.error); return; }
      toast.success("Dirección guardada.");
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="size-7" />} title="Todavía no guardaste direcciones" description="Guardá una para completar el checkout más rápido." action={<Button onClick={openNew}><Plus className="size-5" aria-hidden /> Agregar dirección</Button>} />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="flex flex-col rounded-2xl border border-sand-dark/70 bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-sans font-semibold">{a.label}</span>
                  {a.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800"><Star className="size-3 fill-current" aria-hidden /> Principal</span>
                  ) : (
                    <button type="button" onClick={() => start(async () => { const r = await setDefaultAddress(a.id); if (!r.ok) toast.error(r.error); else router.refresh(); })} className="text-xs text-ink-muted hover:text-brand-700">Usar como principal</button>
                  )}
                </div>
                <p className="text-[15px]">{a.street}{a.apartment && `, ${a.apartment}`}</p>
                <p className="text-[15px] text-ink-soft">{a.city}, {a.province} ({a.zip})</p>
                <p className="mt-1 text-sm text-ink-muted">{a.fullName} · {a.phone}</p>
                <div className="mt-3 flex gap-1 border-t border-sand pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="size-4" aria-hidden /> Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(a)} className="text-danger hover:bg-danger-soft"><Trash2 className="size-4" aria-hidden /> Eliminar</Button>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={openNew} className="self-start"><Plus className="size-5" aria-hidden /> Agregar dirección</Button>
        </>
      )}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nueva dirección" : "Editar dirección"}>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Nombre (ej: Casa, Trabajo)" htmlFor="label"><Input id="label" value={form.label ?? ""} onChange={(e) => set("label", e.target.value)} maxLength={30} /></Field>
          <Field label="Nombre y apellido" htmlFor="fullName" error={errors.fullName}><Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" error={Boolean(errors.fullName)} /></Field>
          <Field label="Teléfono" htmlFor="phone" error={errors.phone}><Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" error={Boolean(errors.phone)} /></Field>
          <Field label="Calle y número" htmlFor="street" error={errors.street}><Input id="street" value={form.street} onChange={(e) => set("street", e.target.value)} autoComplete="street-address" error={Boolean(errors.street)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Piso / depto" htmlFor="apartment" optional><Input id="apartment" value={form.apartment ?? ""} onChange={(e) => set("apartment", e.target.value)} /></Field>
            <Field label="Código postal" htmlFor="zip" error={errors.zip}><Input id="zip" value={form.zip} onChange={(e) => set("zip", e.target.value)} inputMode="numeric" autoComplete="postal-code" error={Boolean(errors.zip)} /></Field>
          </div>
          <Field label="Ciudad" htmlFor="city" error={errors.city}><Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" error={Boolean(errors.city)} /></Field>
          <Field label="Provincia" htmlFor="province" error={errors.province}>
            <Select id="province" value={form.province} onChange={(e) => set("province", e.target.value)} error={Boolean(errors.province)}>
              <option value="">Elegí…</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Indicaciones" htmlFor="notes" optional><Input id="notes" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Ej: timbre B, portón verde" maxLength={200} /></Field>
          <label className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={Boolean(form.isDefault)} onChange={(e) => set("isDefault", e.target.checked)} className="size-5 accent-brand-600" /> Usar como dirección principal</label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit" loading={pending}>Guardar</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => start(async () => { if (!toDelete) return; const r = await deleteAddress(toDelete.id); setToDelete(null); if (!r.ok) toast.error(r.error); else { toast.success("Dirección eliminada."); router.refresh(); } })}
        title="¿Eliminar esta dirección?"
        confirmLabel="Sí, eliminar"
        destructive
        loading={pending}
      />
    </div>
  );
}
