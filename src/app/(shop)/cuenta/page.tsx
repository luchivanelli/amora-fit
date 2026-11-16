import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm, PasswordForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Mis datos", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/ingresar");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true, passwordHash: true } });
  if (!user) redirect("/ingresar");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProfileForm name={user.name ?? ""} email={user.email} phone={user.phone ?? ""} />
      {user.passwordHash && <PasswordForm />}
    </div>
  );
}
