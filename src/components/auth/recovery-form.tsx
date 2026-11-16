"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { recoveryAction, type RecoveryState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/** "Olvidé mi contraseña" sin mail: 1) mail → 2) pregunta de seguridad + nueva contraseña. */
export function RecoveryForm({ whatsapp }: { whatsapp?: string }) {
  const [state, action, pending] = useActionState<RecoveryState, FormData>(recoveryAction, { step: "email" });
  const fe = state.fieldErrors ?? {};

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`¡Hola! No puedo entrar a mi cuenta de la tienda${state.email ? ` (${state.email})` : ""}.`)}`
    : null;

  const errorBox = state.error && (
    <div role="alert" className="flex flex-col gap-3 rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">
      <p>{state.error}</p>
      {waHref && (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 self-start font-medium underline underline-offset-4">
          <MessageCircle className="size-4" aria-hidden /> Escribir por WhatsApp
        </a>
      )}
    </div>
  );

  if (state.step === "question") {
    return (
      <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
        <input type="hidden" name="email" value={state.email ?? ""} />
        <p className="rounded-xl bg-sand/60 px-4 py-3 text-[15px] text-ink-soft">
          Cuenta: <strong className="text-ink">{state.email}</strong>
        </p>
        <Field label={state.question ?? "Tu pregunta de seguridad"} htmlFor="answer" help="No importan mayúsculas ni tildes." error={fe.answer}>
          <Input id="answer" name="answer" autoComplete="off" required autoFocus error={Boolean(fe.answer)} />
        </Field>
        <Field label="Nueva contraseña" htmlFor="password" help="Al menos 8 caracteres." error={fe.password}>
          <Input id="password" name="password" type="password" autoComplete="new-password" required error={Boolean(fe.password)} />
        </Field>
        <Field label="Repetí la nueva contraseña" htmlFor="confirm" error={fe.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required error={Boolean(fe.confirm)} />
        </Field>
        {errorBox}
        <Button type="submit" name="intent" value="reset" size="lg" fullWidth loading={pending}>
          Cambiar contraseña
        </Button>
        <button type="submit" name="intent" value="back" formNoValidate className="text-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
          Usar otro mail
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <Field label="Tu mail" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} required error={Boolean(fe.email)} />
      </Field>
      {errorBox}
      <Button type="submit" name="intent" value="start" size="lg" fullWidth loading={pending}>
        Continuar
      </Button>
      <Link href="/ingresar" className="text-center text-[15px] text-ink-soft underline-offset-4 hover:underline">
        Volver
      </Link>
    </form>
  );
}
