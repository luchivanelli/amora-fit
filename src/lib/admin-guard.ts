import { auth } from "@/lib/auth";

export class NotAdminError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "NotAdminError";
  }
}

/**
 * Se llama al principio de CADA Server Action del panel.
 * No alcanza con el middleware: una acción puede invocarse directamente.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new NotAdminError();
  }
  return session.user;
}
