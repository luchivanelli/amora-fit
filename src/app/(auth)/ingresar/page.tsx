import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Ingresar" };

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string; reset?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) {
    const cb = params.callbackUrl && params.callbackUrl.startsWith("/") ? params.callbackUrl : null;
    redirect(cb ?? (session.user.role === "ADMIN" ? "/admin" : "/cuenta"));
  }

  const notice =
    params.reset === "ok"
      ? { tone: "success" as const, text: "Listo, tu contraseña se cambió. Ingresá con la nueva." }
      : params.error === "sin-permiso"
        ? { tone: "error" as const, text: "Esa cuenta no tiene acceso al panel." }
        : null;

  return (
    <>
      <h1 className="text-3xl font-medium">Hola de nuevo</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Ingresá con tu mail y contraseña.</p>
      {notice && (
        <p
          role="status"
          className={
            notice.tone === "success"
              ? "mt-4 rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800"
              : "mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger"
          }
        >
          {notice.text}
        </p>
      )}
      <LoginForm callbackUrl={params.callbackUrl} />
      <Link
        href="/seguir-pedido"
        className="mt-6 flex items-center gap-3 rounded-2xl border border-sand-dark/70 bg-sand/40 p-4 transition-colors hover:border-brand-400"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Package className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">¿Compraste sin cuenta?</span>
          <span className="block text-sm text-ink-soft">Seguí tu pedido con tu mail y teléfono.</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-ink-muted" aria-hidden />
      </Link>
      <p className="mt-6 border-t border-sand pt-5 text-center text-[15px] text-ink-soft">
        ¿Primera vez por acá?{" "}
        <Link href={`/registro${params.callbackUrl ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : ""}`} className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Creá tu cuenta
        </Link>
      </p>
    </>
  );
}
