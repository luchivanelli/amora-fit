"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type AccountFormState } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

function Notice({ state }: { state: AccountFormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800">{state.success}</p>;
  return null;
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(updateProfile, {});
  return (
    <Card>
      <h2 className="mb-4 font-sans text-lg font-semibold">Mis datos</h2>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field label="Nombre" htmlFor="name" error={state.fieldErrors?.name}>
          <Input id="name" name="name" defaultValue={name} autoComplete="name" error={Boolean(state.fieldErrors?.name)} />
        </Field>
        <Field label="Mail" htmlFor="email" help="Para cambiarlo, escribinos.">
          <Input id="email" value={email} disabled readOnly />
        </Field>
        <Field label="Teléfono" htmlFor="phone" optional error={state.fieldErrors?.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={phone} autoComplete="tel" error={Boolean(state.fieldErrors?.phone)} />
        </Field>
        <Notice state={state} />
        <Button type="submit" loading={pending} className="self-start">Guardar</Button>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(changePassword, {});
  return (
    <Card>
      <h2 className="mb-4 font-sans text-lg font-semibold">Cambiar contraseña</h2>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field label="Contraseña actual" htmlFor="current" error={state.fieldErrors?.current}>
          <Input id="current" name="current" type="password" autoComplete="current-password" error={Boolean(state.fieldErrors?.current)} />
        </Field>
        <Field label="Nueva contraseña" htmlFor="password" error={state.fieldErrors?.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" error={Boolean(state.fieldErrors?.password)} />
        </Field>
        <Field label="Repetí la nueva contraseña" htmlFor="confirm" error={state.fieldErrors?.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" error={Boolean(state.fieldErrors?.confirm)} />
        </Field>
        <Notice state={state} />
        <Button type="submit" variant="secondary" loading={pending} className="self-start">Actualizar contraseña</Button>
      </form>
    </Card>
  );
}
