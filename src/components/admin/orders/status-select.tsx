"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { Select } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ORDER_STATUS_LABELS, ORDER_STATUS_ORDER } from "@/lib/labels";
import { updateOrderStatus } from "@/server/actions/admin/orders";

export function StatusSelect({ orderId, status, compact }: { orderId: string; status: OrderStatus; compact?: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState<OrderStatus>(status);
  const [confirmCancel, setConfirmCancel] = useState<OrderStatus | null>(null);
  const [pending, start] = useTransition();

  const apply = (next: OrderStatus) => {
    const previous = current;
    setCurrent(next); // optimista
    start(async () => {
      const res = await updateOrderStatus({ orderId, status: next });
      if (!res.ok) {
        setCurrent(previous);
        toast.error(res.error);
        return;
      }
      toast.success(`Pedido marcado como “${ORDER_STATUS_LABELS[next]}”.`);
      router.refresh();
    });
  };

  const onChange = (next: OrderStatus) => {
    if (next === current) return;
    if (next === "CANCELADO") return setConfirmCancel(next);
    apply(next);
  };

  return (
    <>
      <Select
        aria-label="Cambiar estado del pedido"
        value={current}
        disabled={pending || current === "CANCELADO"}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className={compact ? "h-11 text-[15px]" : undefined}
      >
        {ORDER_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <ConfirmDialog
        open={confirmCancel !== null}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel) apply(confirmCancel);
          setConfirmCancel(null);
        }}
        title="¿Cancelar este pedido?"
        description="El stock de los productos vuelve a estar disponible. Un pedido cancelado no se puede reabrir."
        confirmLabel="Sí, cancelar pedido"
        cancelLabel="No, volver"
        destructive
      />
    </>
  );
}
