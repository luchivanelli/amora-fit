import type { NextAuthConfig } from "next-auth";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * Configuración "liviana" de Auth.js, sin Prisma ni bcrypt, para poder usarla
 * en el middleware (edge). Los providers se agregan en `auth.ts`.
 */
export const authConfig = {
  pages: {
    signIn: "/ingresar",
  },
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS, // la dueña no tiene que loguearse todo el tiempo
    updateAge: 60 * 60 * 24, // se renueva una vez por día de uso
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (!isAdminRoute) return true;
      if (!auth?.user) return false; // redirige a /ingresar
      if (auth.user.role !== "ADMIN") {
        return Response.redirect(new URL("/ingresar?error=sin-permiso", request.nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
