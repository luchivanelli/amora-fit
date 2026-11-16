/**
 * Crea (o actualiza) el usuario administrador.
 *
 *   npm run admin:create                       → usa ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME del .env
 *   npm run admin:create -- mail@x.com clave   → pasa mail y contraseña por parámetro
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

if (typeof globalThis.WebSocket === "undefined") neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const [argEmail, argPassword, argName] = process.argv.slice(2);
  const email = (argEmail || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = argPassword || process.env.ADMIN_PASSWORD || "";
  const name = argName || process.env.ADMIN_NAME || "Administradora";

  if (!email || !password) {
    console.error("Falta el mail o la contraseña. Definí ADMIN_EMAIL y ADMIN_PASSWORD en .env o pasalos como parámetros.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("La contraseña tiene que tener al menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash, name },
    create: { email, name, role: "ADMIN", passwordHash },
  });
  console.log(`✔ Usuario admin listo: ${user.email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
