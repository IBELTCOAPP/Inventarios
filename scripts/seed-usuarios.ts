/**
 * Crea los usuarios superusuario (rol Administrador) pedidos por el
 * cliente: Diana Said (consultora) y Diego López (Director Industrial,
 * quien recibe la operación de la app). Idempotente — si el correo ya
 * existe, no lo toca (para no pisar una contraseña que la persona ya
 * haya cambiado).
 *
 * Imprime la contraseña temporal de cada usuario NUEVO por consola — no
 * se guarda en ningún lado más que el hash en la base, así que hay que
 * copiarla de aquí y pasársela a la persona.
 *
 * Uso: npx tsx scripts/seed-usuarios.ts
 */
import "./env";

import { db } from "../lib/db";
import { usuarios } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generarPasswordTemporal } from "../lib/auth";
import { PAGINAS } from "../lib/pages";

const SUPERUSUARIOS = [
  { nombre: "Diana Said", email: "innovacion@flowando.com" },
  { nombre: "Diego López", email: "directorindustrial@ibeltco.com.co" },
];

async function main() {
  for (const u of SUPERUSUARIOS) {
    const existente = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, u.email)).limit(1);
    if (existente[0]) {
      console.log(`= ${u.email} ya existe, se omite.`);
      continue;
    }
    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await hashPassword(passwordTemporal);
    await db.insert(usuarios).values({
      nombre: u.nombre,
      email: u.email,
      passwordHash,
      rol: "Administrador",
      paginasPermitidas: PAGINAS.map((p) => p.key), // Administrador ve todo igual; se guarda completo por consistencia
      estado: "Activo",
    });
    console.log(`+ ${u.nombre} <${u.email}> — Administrador`);
    console.log(`  contraseña temporal: ${passwordTemporal}`);
  }
  console.log("Listo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
