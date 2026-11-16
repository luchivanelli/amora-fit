"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { createDraftProduct } from "@/server/actions/admin/products";
import { Button } from "@/components/ui/button";

export function CreateDraftOnMount() {
  const started = useRef(false);
  const [error, setError] = useState(false);

  const run = async () => {
    try {
      await createDraftProduct(); // redirige al formulario
    } catch (e) {
      // NEXT_REDIRECT se propaga solo; cualquier otra cosa es un error real
      if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
      if (typeof e === "object" && e && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
      setError(true);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      {error ? (
        <>
          <p className="text-lg">No pudimos crear el producto.</p>
          <Button onClick={() => { setError(false); void run(); }}>Probar de nuevo</Button>
        </>
      ) : (
        <>
          <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
          <p className="text-[15px] text-ink-soft">Preparando tu nuevo producto…</p>
        </>
      )}
    </div>
  );
}
