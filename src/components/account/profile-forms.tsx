"use client";

import { useActionState } from "react";
import { changePassword, setSecurityQuestion, updateProfile, type AccountFormState } from "@/server/actions/account";
import { SECURITY_QUESTIONS } from "@/lib/security-questions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
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

export function SecurityQuestionForm({ currentQuestion }: { currentQuestion: string | null }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(setSecurityQuestion, {});
  const configured = Boolean(currentQuestion);
  return (
    <Card>
      <h2 className="font-sans text-lg font-semibold">Pregunta de seguridad</h2>
      <p className="mb-4 mt-1 text-sm text-ink-soft">
        Si te olvidás la contraseña, la respondés para elegir una nueva.
      </p>
      {!configured && (
        <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-[15px] text-warn">
          Todavía no tenés una pregunta configurada. Sin ella no vas a poder recuperar tu cuenta sola.
        </p>
      )}
      <form action={action} className="flex flex-col gap-4" noValidate>
        <Field label="Pregunta" htmlFor="sq-question" error={state.fieldErrors?.question}>
          <Select id="sq-question" name="question" defaultValue={currentQuestion ?? ""} error={Boolean(state.fieldErrors?.question)}>
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
        <Field label={configured ? "Nueva respuesta" : "Respuesta"} htmlFor="sq-answer" help="No importan mayúsculas ni tildes." error={state.fieldErrors?.answer}>
          <Input id="sq-answer" name="answer" autoComplete="off" error={Boolean(state.fieldErrors?.answer)} />
        </Field>
        <Field label="Tu contraseña actual" htmlFor="sq-current" help="Para confirmar que sos vos." error={state.fieldErrors?.current}>
          <Input id="sq-current" name="current" type="password" autoComplete="current-password" error={Boolean(state.fieldErrors?.current)} />
        </Field>
        <Notice state={state} />
        <Button type="submit" variant="secondary" loading={pending} className="self-start">
          {configured ? "Cambiar pregunta" : "Guardar pregunta"}
        </Button>
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
