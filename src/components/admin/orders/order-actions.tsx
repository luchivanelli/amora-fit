"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2, Truck, StickyNote } from "lucide-react";
import type { OrderDetail } from "@/server/queries/admin/orders";
import { markOrderPaid, saveAdminNotes, setAgreedShipping } from "@/server/actions/admin/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, MoneyInput, Textarea } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils";

export function OrderActions({ order, whatsappHref, isAgreed }: { order: OrderDetail; whatsappHref: string; isAgreed: boolean }) {
  const router = useRouter();
  const [shipping, setShipping] = useState<number | null>(order.shippingCost);
  const [notes, setNotes] = useState(order.adminNotes ?? "");
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [pending, start] = useTransition();

  const canMarkPaid = ["PENDIENTE_ACUERDO", "PENDIENTE_PAGO"].includes(order.status);

  const saveShipping = () =>
    start(async () => {
      const res = await setAgreedShipping({ orderId: order.id, shippingCost: shipping });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(shipping === null ? "Envío marcado como a coordinar." : `Envío cargado. Nuevo total: ${formatMoney(res.data.total)}.`);
      router.refresh();
    });

  const markPaid = () =>
    start(async () => {
      const res = await markOrderPaid(order.id);
      setConfirmPaid(false);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Pago marcado como recibido.");
      router.refresh();
    });

  const saveNotes = () =>
    start(async () => {
      const res = await saveAdminNotes({ orderId: order.id, adminNotes: notes });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Nota guardada.");
      router.refresh();
    });

  return (
    <>
      <Card>
        <h2 className="mb-3 font-sans text-lg font-semibold">Contactar al cliente</h2>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-lg font-medium text-white shadow-sm hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="size-6" aria-hidden /> Abrir WhatsApp
        </a>
        <p className="mt-2 text-sm text-ink-muted">Se abre con un mensaje ya escrito con el detalle del pedido. Podés editarlo antes de enviar.</p>
      </Card>

      {isAgreed && (
        <Card>
          <h2 className="mb-3 font-sans text-lg font-semibold">Acuerdo con el cliente</h2>
          <div className="flex flex-col gap-5">
            <Field label="Costo de envío acordado" htmlFor="shipping" help="Dejalo vacío si todavía está a coordinar o si lo retira.">
              <div className="flex gap-2">
                <MoneyInput id="shipping" value={shipping} onChange={setShipping} placeholder="0" />
                <Button variant="secondary" onClick={saveShipping} loading={pending}>
                  <Truck className="size-5" aria-hidden /> Guardar
                </Button>
              </div>
            </Field>

            {canMarkPaid ? (
              <Button onClick={() => setConfirmPaid(true)} disabled={pending} fullWidth size="lg">
                <CheckCircle2 className="size-5" aria-hidden /> Marcar pago recibido
              </Button>
            ) : (
              order.paidAt && <p className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800">Pago recibido ✓</p>
            )}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-sans text-lg font-semibold">
          <StickyNote className="size-5 text-ink-muted" aria-hidden /> Nota interna
        </h2>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} placeholder="Solo la ves vos. Ej: “Retira el sábado”." className="min-h-24" />
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={saveNotes} loading={pending} disabled={notes === (order.adminNotes ?? "")}>
            Guardar nota
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        onConfirm={markPaid}
        title="¿Recibiste el pago?"
        description={`El pedido pasa a “Pagado” por ${formatMoney(order.total)}.`}
        confirmLabel="Sí, ya me pagaron"
        loading={pending}
      />
    </>
  );
}
