"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, MessageCircle, Tag, ChevronDown, Lock } from "lucide-react";
import type { CartDTO } from "@/server/queries/shop/cart";
import { placeOrder, validateCoupon, type CouponPreview } from "@/server/actions/checkout";
import type { CheckoutInput } from "@/lib/validations/shop";
import { PROVINCES } from "@/lib/validations/shop";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SectionCard } from "@/components/ui/card";

type Address = { id: string; label: string; fullName: string; phone: string; street: string; apartment: string | null; city: string; province: string; zip: string; isDefault: boolean };

type Props = {
  cart: CartDTO;
  user: { name: string | null; email: string; phone: string | null } | null;
  addresses: Address[];
  mpEnabled: boolean;
  shipping: { flat: number | null; freeFrom: number | null };
};

export function CheckoutForm({ cart, user, addresses, mpEnabled, shipping }: Props) {
  const router = useRouter();
  const def = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [form, setForm] = useState<CheckoutInput>({
    paymentMethod: mpEnabled ? "MERCADO_PAGO" : "ACORDAR_CON_VENDEDOR",
    contactName: def?.fullName ?? user?.name ?? "",
    contactPhone: def?.phone ?? user?.phone ?? "",
    contactEmail: user?.email ?? "",
    deliveryMode: "address",
    street: def?.street ?? "",
    apartment: def?.apartment ?? "",
    city: def?.city ?? "",
    province: def?.province ?? "",
    zip: def?.zip ?? "",
    zone: "",
    notes: "",
    couponCode: "",
    saveAddress: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponPending, startCoupon] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const set = <K extends keyof CheckoutInput>(k: K, v: CheckoutInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });
  };

  const items = cart.items.filter((i) => i.available);
  const subtotal = cart.subtotal;
  const discount = coupon?.discount ?? 0;
  const isMP = form.paymentMethod === "MERCADO_PAGO";
  const shippingCost = isMP && shipping.flat ? (shipping.freeFrom && subtotal - discount >= shipping.freeFrom ? 0 : shipping.flat) : null;
  const total = subtotal - discount + (shippingCost ?? 0);

  const applyCoupon = () =>
    startCoupon(async () => {
      const res = await validateCoupon(couponInput);
      if (!res.ok) {
        setCoupon(null);
        toast.error(res.error);
        return;
      }
      setCoupon(res.data);
      set("couponCode", res.data.code);
      toast.success(`Cupón aplicado: -${formatMoney(res.data.discount)}`);
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await placeOrder(form);
    if (!res.ok) {
      setSubmitting(false);
      if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        const first = Object.keys(res.fieldErrors)[0];
        document.getElementById(`co-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error(res.error);
      return;
    }
    if (res.data.redirectTo.startsWith("http")) window.location.href = res.data.redirectTo;
    else router.push(res.data.redirectTo);
  };

  const fillFromAddress = (id: string) => {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setForm((f) => ({ ...f, contactName: a.fullName, contactPhone: a.phone, street: a.street, apartment: a.apartment ?? "", city: a.city, province: a.province, zip: a.zip, deliveryMode: "address" }));
  };

  const summary = (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-sand">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-sand">
              {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{i.quantity}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">{i.productName}</p>
              <p className="text-sm text-ink-muted">
                {i.size} · {i.color}
              </p>
            </div>
            <span className="text-[15px] font-medium">{formatMoney(i.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Cupón de descuento" aria-label="Cupón de descuento" className="h-11 pl-9 uppercase" disabled={Boolean(coupon)} />
        </div>
        {coupon ? (
          <Button variant="secondary" size="sm" onClick={() => { setCoupon(null); setCouponInput(""); set("couponCode", ""); }}>
            Quitar
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={applyCoupon} loading={couponPending} disabled={!couponInput}>
            Aplicar
          </Button>
        )}
      </div>

      <dl className="flex flex-col gap-1.5 border-t border-sand pt-4 text-[15px]">
        <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-brand-700"><dt>Descuento {coupon?.code}</dt><dd>-{formatMoney(discount)}</dd></div>}
        <div className="flex justify-between">
          <dt className="text-ink-soft">Envío</dt>
          <dd>{shippingCost === null ? <span className="text-ink-soft">A coordinar</span> : shippingCost === 0 ? <span className="text-brand-700">¡Gratis!</span> : formatMoney(shippingCost)}</dd>
        </div>
        <div className="flex justify-between border-t border-sand pt-2 text-lg font-semibold"><dt>Total</dt><dd>{formatMoney(total)}</dd></div>
      </dl>
      {shippingCost === null && <p className="text-sm text-ink-muted">{isMP ? "El costo de envío se coordina después del pago según tu zona." : "El costo de envío lo acordamos juntas según tu zona."}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* Resumen colapsable en celular */}
      <div className="lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between rounded-2xl border border-sand-dark/70 bg-surface px-4 py-3" aria-expanded={summaryOpen}>
          <span className="flex items-center gap-2 text-[15px] font-medium">
            <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} aria-hidden /> {summaryOpen ? "Ocultar" : "Ver"} resumen ({cart.count})
          </span>
          <span className="font-semibold">{formatMoney(total)}</span>
        </button>
        {summaryOpen && <div className="mt-3 rounded-2xl border border-sand-dark/70 bg-surface p-4">{summary}</div>}
      </div>

      <div className="flex flex-col gap-6">
        <SectionCard step={1} title="Tus datos" description="Para avisarte sobre tu pedido.">
          {!user && (
            <p className="mb-5 rounded-xl bg-sand/50 px-4 py-3 text-[15px]">
              ¿Ya tenés cuenta?{" "}
              <Link href="/ingresar?callbackUrl=/checkout" className="font-medium text-brand-700 underline-offset-4 hover:underline">Ingresá</Link> para completar más rápido. También podés comprar como invitada.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div id="co-contactName" className="sm:col-span-2">
              <Field label="Nombre y apellido" htmlFor="contactName" error={errors.contactName}>
                <Input id="contactName" autoComplete="name" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} error={Boolean(errors.contactName)} />
              </Field>
            </div>
            <div id="co-contactPhone">
              <Field label="Teléfono (WhatsApp)" htmlFor="contactPhone" error={errors.contactPhone}>
                <Input id="contactPhone" type="tel" autoComplete="tel" inputMode="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} error={Boolean(errors.contactPhone)} />
              </Field>
            </div>
            <div id="co-contactEmail">
              <Field label="Mail" htmlFor="contactEmail" error={errors.contactEmail}>
                <Input id="contactEmail" type="email" autoComplete="email" inputMode="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} error={Boolean(errors.contactEmail)} />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard step={2} title="Entrega">
          {addresses.length > 0 && (
            <Field label="Usar una dirección guardada" htmlFor="savedAddress" className="mb-5">
              <Select id="savedAddress" defaultValue={def?.id ?? ""} onChange={(e) => fillFromAddress(e.target.value)}>
                <option value="">Escribir otra…</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} · {a.street}, {a.city}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de entrega">
            {([["address", "Dirección completa"], ["zone", "Solo mi zona"]] as const).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={form.deliveryMode === v} onClick={() => set("deliveryMode", v)} className={cn("min-h-12 rounded-xl border px-3 text-[15px] font-medium", form.deliveryMode === v ? "border-brand-600 bg-brand-50 text-brand-900" : "border-sand-dark bg-surface")}>
                {label}
              </button>
            ))}
          </div>
          {form.deliveryMode === "address" ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div id="co-street" className="sm:col-span-2">
                <Field label="Calle y número" htmlFor="street" error={errors.street}>
                  <Input id="street" autoComplete="street-address" value={form.street ?? ""} onChange={(e) => set("street", e.target.value)} error={Boolean(errors.street)} />
                </Field>
              </div>
              <Field label="Piso / depto" htmlFor="apartment" optional>
                <Input id="apartment" value={form.apartment ?? ""} onChange={(e) => set("apartment", e.target.value)} />
              </Field>
              <div id="co-zip">
                <Field label="Código postal" htmlFor="zip" error={errors.zip}>
                  <Input id="zip" autoComplete="postal-code" inputMode="numeric" value={form.zip ?? ""} onChange={(e) => set("zip", e.target.value)} error={Boolean(errors.zip)} />
                </Field>
              </div>
              <div id="co-city">
                <Field label="Ciudad" htmlFor="city" error={errors.city}>
                  <Input id="city" autoComplete="address-level2" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} error={Boolean(errors.city)} />
                </Field>
              </div>
              <div id="co-province">
                <Field label="Provincia" htmlFor="province" error={errors.province}>
                  <Select id="province" autoComplete="address-level1" value={form.province ?? ""} onChange={(e) => set("province", e.target.value)} error={Boolean(errors.province)}>
                    <option value="">Elegí…</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              {user && (
                <label className="flex items-center gap-3 text-[15px] sm:col-span-2">
                  <input type="checkbox" checked={Boolean(form.saveAddress)} onChange={(e) => set("saveAddress", e.target.checked)} className="size-5 accent-brand-600" />
                  Guardar esta dirección en mi cuenta
                </label>
              )}
            </div>
          ) : (
            <div id="co-zone">
              <Field label="Tu zona o barrio" htmlFor="zone" help="Por ejemplo: Villa Urquiza, CABA. Después coordinamos el punto exacto." error={errors.zone}>
                <Input id="zone" value={form.zone ?? ""} onChange={(e) => set("zone", e.target.value)} error={Boolean(errors.zone)} />
              </Field>
            </div>
          )}
        </SectionCard>

        <SectionCard step={3} title="¿Cómo querés pagar?" id="co-paymentMethod">
          <div className="flex flex-col gap-3" role="radiogroup" aria-label="Método de pago">
            <PaymentOption
              selected={isMP}
              disabled={!mpEnabled}
              onSelect={() => set("paymentMethod", "MERCADO_PAGO")}
              icon={<CreditCard className="size-5" aria-hidden />}
              title="Mercado Pago"
              text={mpEnabled ? "Tarjeta de crédito o débito, dinero en cuenta y cuotas. Te llevamos a Mercado Pago y volvés acá." : "No disponible por el momento."}
            />
            <PaymentOption
              selected={!isMP}
              onSelect={() => set("paymentMethod", "ACORDAR_CON_VENDEDOR")}
              icon={<MessageCircle className="size-5" aria-hidden />}
              title="Acordar con la vendedora"
              text="Confirmás el pedido sin pagar ahora. Te escribimos por WhatsApp para coordinar pago (transferencia, efectivo) y entrega."
            />
          </div>
          {errors.paymentMethod && <p className="mt-2 text-sm text-danger">{errors.paymentMethod}</p>}
        </SectionCard>

        <SectionCard step={4} title="Observaciones" description="¿Algo que tengamos que saber? Horarios, referencias, un regalo…">
          <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={1000} className="min-h-24" aria-label="Observaciones" />
          {errors.notes && <p className="mt-2 text-sm text-danger">{errors.notes}</p>}
        </SectionCard>

        <div className="lg:hidden">
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {isMP ? `Pagar ${formatMoney(total)}` : "Confirmar pedido"}
          </Button>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-sand-dark/70 bg-surface p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold">Tu pedido</h2>
          {summary}
          <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-5">
            {isMP ? `Pagar ${formatMoney(total)}` : "Confirmar pedido"}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Lock className="size-3.5" aria-hidden /> Tus datos viajan cifrados y no los compartimos.
          </p>
        </div>
      </aside>
    </form>
  );
}

function PaymentOption({ selected, disabled, onSelect, icon, title, text }: { selected: boolean; disabled?: boolean; onSelect: () => void; icon: React.ReactNode; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-50", selected ? "border-brand-600 bg-brand-50" : "border-sand-dark bg-surface hover:border-brand-400")}
    >
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-brand-600" : "border-sand-dark")}>
        {selected && <span className="size-2.5 rounded-full bg-brand-600" />}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 font-sans text-[15px] font-semibold">
          {icon} {title}
        </span>
        <span className="mt-1 block text-sm text-ink-soft">{text}</span>
      </span>
    </button>
  );
}
