import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "Mis direcciones", robots: { index: false } };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar");
  const addresses = await prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return (
    <AddressManager
      addresses={addresses.map((a) => ({ id: a.id, label: a.label, fullName: a.fullName, phone: a.phone, street: a.street, apartment: a.apartment ?? "", city: a.city, province: a.province, zip: a.zip, notes: a.notes ?? "", isDefault: a.isDefault }))}
    />
  );
}
