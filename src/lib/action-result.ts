/**
 * Resultado tipado de toda Server Action del panel.
 * `error` siempre es un texto pensado para mostrarse tal cual a la dueña.
 */
export type FieldErrors = Record<string, string>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = undefined>(error: string, fieldErrors?: FieldErrors): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export const GENERIC_ERROR = "Algo salió mal. Probá de nuevo en unos segundos.";
export const NO_PERMISSION_ERROR = "Tu sesión venció o no tenés permiso. Volvé a ingresar.";

/** Convierte un error de Zod en mensajes por campo, sin texto técnico. */
export function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
