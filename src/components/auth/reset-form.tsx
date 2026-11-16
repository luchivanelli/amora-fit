"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthFormState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordAction, {});

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field label="Nueva contraseña" htmlFor="password" error={state.fieldErrors?.password}>
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
      <Button type="submit" size="lg" fullWidth loading={pending}>
        Guardar contraseña
      </Button>
      <Link href="/ingresar" className="text-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
        Volver
      </Link>
    </form>
  );
}
