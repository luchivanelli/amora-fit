import type { Metadata } from "next";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = { title: "Olvidé mi contraseña" };

/**
 * Recuperación con pregunta de seguridad (sin mail). El flujo anterior por mail
 * (ForgotForm + /restablecer/[token]) sigue en el código por si se vuelve a usar.
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-medium">¿Olvidaste tu contraseña?</h1>
      <p className="mt-1 text-[15px] text-ink-soft">
        Escribí tu mail, respondé tu pregunta de seguridad y elegí una contraseña nueva.
      </p>
      <RecoveryForm whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER} />
    </>
  );
}
