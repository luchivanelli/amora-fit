import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Olvidé mi contraseña" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-medium">¿Olvidaste tu contraseña?</h1>
      <p className="mt-1 text-[15px] text-ink-soft">
        Escribí tu mail y te mandamos un link para elegir una nueva.
      </p>
      <ForgotForm />
    </>
  );
}
