import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Primera barrera: nadie sin sesión de ADMIN llega a /admin.
// La segunda barrera (requireAdmin) vive dentro de cada Server Action.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
