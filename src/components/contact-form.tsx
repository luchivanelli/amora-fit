"use client";

import { useActionState } from "react";
import { sendContactMessage, type SimpleFormState } from "@/server/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export function ContactForm() {
  const [state, action, pending] = useActionState<SimpleFormState, FormData>(sendContactMessage, {});

  if (state.success) {
    return <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-[15px] text-brand-800">{state.success}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Tu nombre" htmlFor="c-name" error={state.fieldErrors?.name}>
        <Input id="c-name" name="name" autoComplete="name" required error={Boolean(state.fieldErrors?.name)} />
      </Field>
      <Field label="Tu mail" htmlFor="c-email" error={state.fieldErrors?.email}>
        <Input id="c-email" name="email" type="email" autoComplete="email" inputMode="email" required error={Boolean(state.fieldErrors?.email)} />
      </Field>
      <Field label="Tu consulta" htmlFor="c-message" error={state.fieldErrors?.message}>
        <Textarea id="c-message" name="message" rows={5} required maxLength={2000} error={Boolean(state.fieldErrors?.message)} />
      </Field>
      {state.error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending} className="self-start">Enviar consulta</Button>
    </form>
  );
}
