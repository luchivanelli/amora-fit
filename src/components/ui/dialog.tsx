"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** En celular sale como hoja desde abajo; en escritorio centrado. */
  sheet?: boolean;
  className?: string;
};

/** Usa el <dialog> nativo: foco atrapado, Escape cierra, accesible sin librerías. */
export function Dialog({ open, onClose, title, description, children, sheet = true, className }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // clic en el fondo
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-0 w-full max-w-full bg-transparent p-0 text-ink backdrop:bg-scrim/55 open:flex",
        sheet
          ? "fixed inset-x-0 bottom-0 top-auto max-h-[92dvh] sm:inset-0 sm:m-auto sm:max-h-[85vh] sm:max-w-md"
          : "fixed inset-0 m-auto max-h-[85vh] max-w-md",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden bg-surface shadow-xl",
          sheet ? "rounded-t-2xl sm:rounded-2xl" : "rounded-2xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h2 id="dialog-title" className="font-sans text-lg font-semibold">
              {title}
            </h2>
            {description && <p className="mt-1 text-[15px] text-ink-soft">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-2 rounded-full p-2 text-ink-muted hover:bg-sand hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-4 safe-bottom">{children}</div>
      </div>
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Sí, continuar",
  cancelLabel = "Cancelar",
  destructive,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
