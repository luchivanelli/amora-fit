"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

const GENERIC = [
  ["XS", "80–84", "60–64", "86–90"],
  ["S", "84–88", "64–68", "90–94"],
  ["M", "88–92", "68–72", "94–98"],
  ["L", "92–98", "72–78", "98–104"],
  ["XL", "98–104", "78–84", "104–110"],
  ["XXL", "104–110", "84–92", "110–116"],
];

export function SizeGuide({ custom }: { custom?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[15px] text-brand-700 underline-offset-4 hover:underline">
        <Ruler className="size-4" aria-hidden /> Guía de talles
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Guía de talles" description="Medidas del cuerpo en centímetros. Si estás entre dos talles, elegí el más grande para mayor comodidad.">
        {custom ? (
          <div className="whitespace-pre-line text-[15px] leading-relaxed">{custom}</div>
        ) : (
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-sand text-left text-sm text-ink-soft">
                <th className="py-2 font-medium">Talle</th>
                <th className="py-2 font-medium">Busto</th>
                <th className="py-2 font-medium">Cintura</th>
                <th className="py-2 font-medium">Cadera</th>
              </tr>
            </thead>
            <tbody>
              {GENERIC.map(([t, b, c, h]) => (
                <tr key={t} className="border-b border-sand last:border-b-0">
                  <td className="py-2 font-semibold">{t}</td>
                  <td className="py-2">{b}</td>
                  <td className="py-2">{c}</td>
                  <td className="py-2">{h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-4 text-sm text-ink-muted">Para corpiños con talle numérico (85, 90, 95…), medí el contorno debajo del busto.</p>
      </Dialog>
    </>
  );
}
