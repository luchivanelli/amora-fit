"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Swatch } from "@/components/ui/swatch";
import { DEFAULT_COLORS } from "@/lib/labels";
import { joinColorNames, joinHexes, MAX_TONES_PER_COLOR } from "@/lib/colors";
import { cn } from "@/lib/utils";

type Tone = { name: string; hex: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (color: { name: string; hex: string }) => void;
  existing: string[];
};

const DEFAULT_CUSTOM_HEX = "#767c4e";

/**
 * Agregar un color al producto. Se pueden marcar varios tonos a la vez:
 * en ese caso se guarda como UN solo color combinado (ej: "Blanco y Negro"),
 * que es una sola columna de stock y tiene sus propias fotos en la tienda.
 */
export function ColorDialog({ open, onClose, onAdd, existing }: Props) {
  const [tones, setTones] = useState<Tone[]>([]);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM_HEX);
  const [error, setError] = useState<string | null>(null);

  const suggestedName = joinColorNames(tones.map((t) => t.name));
  const finalName = nameTouched ? name : suggestedName;
  const combinedHex = joinHexes(tones.map((t) => t.hex));

  const isPicked = (hex: string) => tones.some((t) => t.hex.toLowerCase() === hex.toLowerCase());

  const toggleTone = (tone: Tone) => {
    setError(null);
    if (isPicked(tone.hex)) {
      setTones(tones.filter((t) => t.hex.toLowerCase() !== tone.hex.toLowerCase()));
      return;
    }
    if (tones.length >= MAX_TONES_PER_COLOR) {
      setError(`Podés combinar hasta ${MAX_TONES_PER_COLOR} tonos en un mismo color.`);
      return;
    }
    setTones([...tones, tone]);
  };

  const reset = () => {
    setTones([]);
    setName("");
    setNameTouched(false);
    setCustomHex(DEFAULT_CUSTOM_HEX);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (tones.length === 0) return setError("Marcá al menos un tono.");
    const clean = finalName.trim();
    if (clean.length < 1) return setError("Poné un nombre al color (por ejemplo, Lila).");
    if (existing.some((c) => c.toLowerCase() === clean.toLowerCase())) return setError("Ese color ya está en la lista.");
    onAdd({ name: clean, hex: combinedHex });
    close();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Agregar un color"
      description="Marcá uno o más tonos. Si marcás varios, se guarda como un solo color combinado (por ejemplo: Blanco y Negro)."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-5"
      >
        <div>
          <p className="mb-2 text-[15px] font-medium">Tonos</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((c) => {
              const picked = isPicked(c.hex);
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => toggleTone(c)}
                  aria-pressed={picked}
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                    picked ? "border-ink" : "border-ink/10",
                  )}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                  title={c.name}
                >
                  {picked && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-paper/90 text-[#2b2a26]">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-sand-dark text-xs text-ink-soft" title="Elegir otro tono">
              <span aria-hidden className="absolute inset-0 rounded-full" style={{ backgroundColor: customHex, opacity: 0.45 }} />
              <span className="relative">Otro</span>
              <input type="color" value={customHex} onChange={(e) => setCustomHex(e.target.value)} className="sr-only" aria-label="Elegir otro tono" />
            </label>
            <Button type="button" size="sm" variant="secondary" onClick={() => toggleTone({ name: "", hex: customHex })} disabled={isPicked(customHex)}>
              <Plus className="size-4" aria-hidden /> Sumar este tono
            </Button>
          </div>
        </div>

        {tones.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-sand/50 px-4 py-3">
            <Swatch hex={combinedHex} className="size-12 shrink-0" />
            <div className="min-w-0 text-sm text-ink-soft">
              <p className="font-medium text-ink">{tones.length === 1 ? "Un solo tono" : `${tones.length} tonos combinados`}</p>
              <p className="truncate">Tocá un tono de arriba para sacarlo.</p>
            </div>
          </div>
        )}

        <Field
          label="Nombre del color"
          htmlFor="color-name"
          error={error ?? undefined}
          help="Así lo va a ver la clienta en la tienda. Lo completamos solo, pero podés cambiarlo."
        >
          <Input
            id="color-name"
            value={finalName}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
              setError(null);
            }}
            placeholder="Por ejemplo: Blanco y Negro"
            maxLength={30}
            error={Boolean(error)}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit">Agregar color</Button>
        </div>
      </form>
    </Dialog>
  );
}
