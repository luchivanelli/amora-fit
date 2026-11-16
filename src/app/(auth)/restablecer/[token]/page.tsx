import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <h1 className="text-3xl font-medium">Elegí una nueva contraseña</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Tiene que tener al menos 8 caracteres.</p>
      <ResetForm token={token} />
    </>
  );
}
