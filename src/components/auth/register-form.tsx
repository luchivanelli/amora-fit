"use client";

import { useActionState } from "react";
import { registerAction, type AccountFormState } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";

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
      <div className="flex flex-col gap-4 rounded-2xl border border-sand-dark/70 bg-sand/30 p-4">
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">Pregunta de seguridad.</strong> La vas a usar si te olvidás la contraseña.
        </p>
        <Field label="Pregunta" htmlFor="securityQuestion" error={state.fieldErrors?.securityQuestion}>
          <Select id="securityQuestion" name="securityQuestion" defaultValue="" required error={Boolean(state.fieldErrors?.securityQuestion)}>
            <option value="" disabled>
              Elegí una pregunta
            </option>
            {Object.entries(SECURITY_QUESTIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Respuesta" htmlFor="securityAnswer" help="Algo que recuerdes siempre. No importan mayúsculas ni tildes." error={state.fieldErrors?.securityAnswer}>
          <Input id="securityAnswer" name="securityAnswer" autoComplete="off" required error={Boolean(state.fieldErrors?.securityAnswer)} />
        </Field>
      </div>
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
