import type { Metadata } from "next";
import { listCoupons } from "@/server/queries/admin/coupons";
import { PageHeader } from "@/components/ui/page-header";
import { CouponManager } from "@/components/admin/coupons/coupon-manager";

export const metadata: Metadata = { title: "Cupones" };

export default async function CouponsPage() {
  const coupons = await listCoupons();
  return (
    <div>
      <PageHeader title="Cupones" subtitle="Códigos de descuento que tus clientas escriben al finalizar la compra." />
      <CouponManager coupons={coupons} />
    </div>
  );
}
