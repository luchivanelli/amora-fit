import { handlers } from "@/lib/auth";

// Lo exige Auth.js para manejar la sesión. No es una API propia del negocio.
export const { GET, POST } = handlers;
