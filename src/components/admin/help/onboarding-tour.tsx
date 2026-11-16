"use client";

import { useState, useTransition } from "react";
import { Shirt, Package, Tags, CircleHelp, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { markOnboardingSeen } from "@/server/actions/admin/onboarding";

const STEPS = [
  {
    icon: Sparkles,
    title: "¡Bienvenida a tu panel!",
    text: "Desde acá manejás tu tienda AMORA. Te mostramos en 4 pasos lo más importante. Podés volver a ver esto desde “Ayuda”.",
  },
  {
    icon: Shirt,
    title: "Productos",
    text: "Cargá tus prendas con fotos, precio, talles y colores. Mientras sea “Borrador” nadie la ve. Cuando esté lista, tocá “Publicar”.",
  },
  {
    icon: Package,
    title: "Pedidos",
    text: "Cada compra aparece acá. Cambiá el estado a medida que avanza (Pagado, Preparando, Enviado…). En los pedidos “a acordar” tenés un botón para escribirle al cliente por WhatsApp.",
  },
  {
    icon: Tags,
    title: "Categorías",
    text: "Ordená tu tienda en Ropa íntima y Ropa deportiva, con subcategorías. Podés renombrar y reordenar arrastrando.",
  },
  {
    icon: CircleHelp,
    title: "¿Dudas?",
    text: "En “Ayuda” hay guías cortas paso a paso. Y si algo no se guarda, el panel te avisa al instante.",
  },
];

export function OnboardingTour({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);
  const [i, setI] = useState(0);
  const [pending, start] = useTransition();

  const finish = () => {
    setOpen(false);
    start(async () => {
      await markOnboardingSeen();
    });
  };

  const step = STEPS[i];
  const Icon = step.icon;
  const last = i === STEPS.length - 1;

  return (
    <Dialog open={open} onClose={finish} title={step.title} sheet>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Icon className="size-8" aria-hidden />
        </span>
        <p className="text-[15px] leading-relaxed text-ink-soft">{step.text}</p>
        <div className="flex gap-1.5" aria-label={`Paso ${i + 1} de ${STEPS.length}`}>
          {STEPS.map((_, k) => (
            <span key={k} aria-hidden className={k === i ? "h-2 w-6 rounded-full bg-brand-600" : "size-2 rounded-full bg-sand-dark"} />
          ))}
        </div>
        <div className="mt-2 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={finish} disabled={pending}>
            Saltar
          </Button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button variant="secondary" onClick={() => setI((v) => v - 1)}>
                Anterior
              </Button>
            )}
            <Button onClick={last ? finish : () => setI((v) => v + 1)} loading={pending && last}>
              {last ? "¡Empezar!" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
