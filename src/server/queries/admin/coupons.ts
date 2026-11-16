import { prisma } from "@/lib/prisma";

export type CouponStatus = "activo" | "pausado" | "programado" | "vencido" | "agotado";

export type CouponDTO = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  status: CouponStatus;
};

export function getCouponStatus(c: { isActive: boolean; startsAt: Date | null; expiresAt: Date | null; maxUses: number | null; usedCount: number }, now = new Date()): CouponStatus {
  if (!c.isActive) return "pausado";
  if (c.expiresAt && c.expiresAt < now) return "vencido";
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return "agotado";
  if (c.startsAt && c.startsAt > now) return "programado";
  return "activo";
}

export async function listCoupons(): Promise<CouponDTO[]> {
  const rows = await prisma.coupon.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const now = new Date();
  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: Number(c.value),
    minSubtotal: c.minSubtotal === null ? null : Number(c.minSubtotal),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    startsAt: c.startsAt?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    status: getCouponStatus(c, now),
  }));
}
