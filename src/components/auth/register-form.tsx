"use client";

import { useActionState } from "react";
import { registerAction, type AccountFormState } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(registerAction, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Tu nombre" htmlFor="name" error={state.fieldErrors?.name}>
        <Input id="name" name="name" autoComplete="name" required error={Boolean(state.fieldErrors?.name)} />
      </Field>
      <Field label="Tu mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required error={Boolean(state.fieldErrors?.email)} />
      </Field>
      <Field label="Contraseña" htmlFor="password" help="Al menos 8 caracteres." error={state.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required error={Boolean(state.fieldErrors?.password)} />
      </Field>
      <Field label="Repetí la contraseña" htmlFor="confirm" error={state.fieldErrors?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required error={Boolean(state.fieldErrors?.confirm)} />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800">
          {state.success}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        Crear cuenta
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Al crear tu cuenta aceptás los <a href="/terminos" className="underline">términos</a> y la <a href="/privacidad" className="underline">política de privacidad</a>.
      </p>
    </form>
  );
}
