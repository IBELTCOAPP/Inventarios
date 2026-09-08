/**
 * Siembra los maestros de Operarios, Líneas y Clientes con los datos que
 * dio el cliente. Es idempotente respecto a duplicados obvios (no inserta
 * si ya existe un registro con el mismo nombre/letra), así que se puede
 * volver a correr sin generar copias.
 *
 * Uso: npx tsx scripts/seed-maestros.ts
 */
import "./env";

import { db } from "../lib/db";
import { operarios, lineas, clientes } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const OPERARIOS = [
  "Duvan Zapata",
  "Andrés Diaz",
  "Andrés Gonzales",
  "Julian Zapata",
  "Brayan Rodriguez",
  "Daniel Rojas",
  "José Cantillo",
];

const LINEAS = [
  "PVC",
  "PU",
  "MALLA TEFLON",
  "BANDA DE TRANSMISIÓN PLANA",
  "TEFLON 14",
  "TEFLON 10",
  "BANDAS TRANSPORTADORAS SINTETICAS",
];

// Clientes de prueba para el ensayo (el cliente pidió probar con datos de
// prueba antes de cargar los clientes reales). IBELTCO usa la letra "C",
// tal como indicó el ejemplo: pedido C-1234.
const CLIENTES = [
  { nombre: "IBELTCO", letra: "C", nit: "900748549" },
  { nombre: "CLIENTE DE PRUEBA 1", letra: "A", nit: "" },
  { nombre: "CLIENTE DE PRUEBA 2", letra: "B", nit: "" },
];

async function main() {
  console.log("Sembrando maestro de Operarios...");
  for (const nombre of OPERARIOS) {
    const existe = await db.select().from(operarios).where(eq(operarios.nombre, nombre)).limit(1);
    if (existe.length === 0) await db.insert(operarios).values({ nombre, estado: "Activo" });
  }

  console.log("Sembrando maestro de Líneas...");
  for (const nombre of LINEAS) {
    const existe = await db.select().from(lineas).where(eq(lineas.nombre, nombre)).limit(1);
    if (existe.length === 0) await db.insert(lineas).values({ nombre, estado: "Activo" });
  }

  console.log("Sembrando maestro de Clientes (datos de prueba)...");
  for (const c of CLIENTES) {
    const existe = await db.select().from(clientes).where(eq(clientes.letra, c.letra)).limit(1);
    if (existe.length === 0) {
      await db.insert(clientes).values({ nombre: c.nombre, letra: c.letra, nit: c.nit, estado: "Activo" });
    }
  }

  console.log("Listo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
