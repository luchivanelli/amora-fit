"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(forgotPasswordAction, {});

  if (state.success) {
    return (
      <div className="mt-6 flex flex-col gap-5">
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800">
          {state.success}
        </p>
        <p className="text-sm text-ink-muted">Revisá también la carpeta de correo no deseado.</p>
        <Link href="/ingresar" className="text-center text-[15px] text-brand-700 underline-offset-4 hover:underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <Field label="Tu mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required error={Boolean(state.fieldErrors?.email)} />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        Enviarme el link
      </Button>
      <Link href="/ingresar" className="text-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
        Volver
      </Link>
    </form>
  );
}
