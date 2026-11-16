import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, orderNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_METHOD_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };

export default async function MyOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar");
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, status: true, paymentMethod: true, total: true, createdAt: true, _count: { select: { items: true } } },
  });

  if (orders.length === 0) {
    return <EmptyState icon={<Package className="size-7" />} title="Todavía no hiciste pedidos" description="Cuando compres algo, lo vas a poder seguir desde acá." action={<LinkButton href="/tienda">Ir a la tienda</LinkButton>} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/cuenta/pedidos/${o.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-sand-dark/70 bg-surface p-4 hover:bg-sand/40">
            <div>
              <p className="font-semibold">{orderNumber(o.number)}</p>
              <p className="text-sm text-ink-muted">
                {formatDate(o.createdAt)} · {o._count.items} {o._count.items === 1 ? "producto" : "productos"} · {PAYMENT_METHOD_LABELS[o.paymentMethod]}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold">{formatMoney(Number(o.total))}</span>
              <Badge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
