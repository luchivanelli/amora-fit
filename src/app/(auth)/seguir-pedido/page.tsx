import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { OrderLookupForm } from "@/components/auth/order-lookup-form";

export const metadata: Metadata = { title: "Seguí tu pedido", robots: { index: false } };

export default async function OrderLookupPage() {
  const session = await auth();
  return (
    <>
      <h1 className="text-3xl font-medium">Seguí tu pedido</h1>
      <p className="mt-1 text-[15px] text-ink-soft">¿Compraste sin crear una cuenta? Ingresá tus datos y mirá cómo va tu pedido.</p>
      <OrderLookupForm />
      <p className="mt-6 border-t border-sand pt-5 text-center text-[15px] text-ink-soft">
        {session?.user ? (
          <>
            ¿Compraste con tu cuenta?{" "}
            <Link href="/cuenta/pedidos" className="font-medium text-brand-700 underline-offset-4 hover:underline">
              Ver mis pedidos
            </Link>
          </>
        ) : (
          <>
            ¿Tenés cuenta?{" "}
            <Link href="/ingresar?callbackUrl=/cuenta/pedidos" className="font-medium text-brand-700 underline-offset-4 hover:underline">
              Ingresá
            </Link>
          </>
        )}
      </p>
    </>
  );
}
