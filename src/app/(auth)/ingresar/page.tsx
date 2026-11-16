import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
      <p className="mt-6 border-t border-sand pt-5 text-center text-[15px] text-ink-soft">
        ¿Primera vez por acá?{" "}
        <Link href={`/registro${params.callbackUrl ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : ""}`} className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Creá tu cuenta
        </Link>
      </p>
    </>
  );
}
