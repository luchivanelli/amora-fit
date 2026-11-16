"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type AuthFormState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="mt-6 flex flex-col gap-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <Field label="Tu mail" htmlFor="email" error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nombre@ejemplo.com"
          required
          error={Boolean(state.fieldErrors?.email)}
        />
      </Field>

      <Field label="Contraseña" htmlFor="password" error={state.fieldErrors?.password}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="pr-12"
            error={Boolean(state.fieldErrors?.password)}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted hover:text-ink"
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </Field>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[15px] text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        Ingresar
      </Button>

      <Link href="/olvide-mi-contrasena" className="text-center text-[15px] text-brand-700 underline-offset-4 hover:underline">
        Olvidé mi contraseña
      </Link>
    </form>
  );
}
