import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/cuenta");
  const { callbackUrl } = await searchParams;

  return (
    <>
      <h1 className="text-3xl font-medium">Creá tu cuenta</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Guardá tus datos, seguí tus pedidos y armá tu lista de favoritos.</p>
      <RegisterForm callbackUrl={callbackUrl} />
      <p className="mt-6 border-t border-sand pt-5 text-center text-[15px] text-ink-soft">
        ¿Ya tenés cuenta?{" "}
        <Link href={`/ingresar${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </>
  );
}
