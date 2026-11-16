"use client";

import { useEffect } from "react";
import { CloudOff } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-warn-soft text-warn">
        <CloudOff className="size-7" aria-hidden />
      </span>
      <h1 className="text-3xl font-medium">Algo salió mal</h1>
      <p className="max-w-sm text-[15px] text-ink-soft">
        No te preocupes, no se perdió nada. Probá de nuevo y, si sigue pasando, revisá tu conexión a internet.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Probar de nuevo</Button>
        <LinkButton href="/admin" variant="secondary">
          Ir al inicio
        </LinkButton>
      </div>
    </div>
  );
}
