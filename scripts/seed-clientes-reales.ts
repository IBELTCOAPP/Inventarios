/**
 * Carga los clientes reales de Ibelco, extraídos de las dos fuentes que dio
 * el cliente:
 *  - Hoja "Historico_Cortes" de Planos Rollos.xlsx (columna Cliente): da los
 *    nombres, sin datos de contacto.
 *  - Los 4 PDFs de muestra "pedido de taller" (8-17093/95/96/97.pdf): dan
 *    NIT, teléfono y persona de contacto para 4 de esos clientes.
 * (No se encontraron datos de clientes en el Apps Script/AppSheet viejo —
 * ese sistema no tenía datos propios, consumía un Google Sheet al que ya no
 * hay acceso; ver memoria ibelco-programa-appscript).
 *
 * Los 2 "CLIENTE DE PRUEBA" sembrados para el ensayo (letras A y B) quedan
 * marcados Inactivo — ya no hacen falta ahora que hay clientes reales, pero
 * se conservan por si algún corte de prueba los referencia.
 *
 * Idempotente: no reinserta si ya existe un cliente con esa letra o ese
 * nombre.
 *
 * Uso: npx tsx scripts/seed-clientes-reales.ts
 */
import "./env";

import { db } from "../lib/db";
import { clientes } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const CLIENTES_REALES: { nombre: string; letra: string; nit?: string; contacto?: string; telefono?: string }[] = [
  { nombre: "BANDAS Y CORREAS MEDELLIN SAS", letra: "D", nit: "900399523-8", contacto: "JHON FREDY", telefono: "4446892" },
  { nombre: "BRICEÑO HERNANDEZ JUAN JOSE", letra: "E" },
  { nombre: "CDEM & CDEB SAS", letra: "F" },
  { nombre: "ECONOTEJIDOS SAS", letra: "G" },
  { nombre: "FERRECORREAS LAR SAS", letra: "H", nit: "901839151-4", contacto: "ANDRES" },
  { nombre: "IMPORT BELT", letra: "I" },
  { nombre: "INDUSTRIA DE GALLETAS GRECO SA", letra: "J", nit: "811017920-8", contacto: "CLAUDIA BUSTAMANTE", telefono: "2893390" },
  { nombre: "MAPEI COLOMBIA SAS", letra: "K" },
  { nombre: "NORTEJIDOS", letra: "L" },
  { nombre: "REAL SUMINISTROS", letra: "M" },
  { nombre: "RIVER HOME NW SAS", letra: "N" },
  { nombre: "TEÑIMOS SAS", letra: "O" },
  { nombre: "UNION MEDICAL SAS", letra: "P", nit: "811039981-1", contacto: "JUAN FERNANDO · cel 300 752 1394", telefono: "4480334" },
];

const LETRAS_PRUEBA = ["A", "B"];

async function main() {
  console.log("Sembrando clientes reales...");
  for (const c of CLIENTES_REALES) {
    const existePorLetra = await db.select().from(clientes).where(eq(clientes.letra, c.letra)).limit(1);
    const existePorNombre = await db.select().from(clientes).where(eq(clientes.nombre, c.nombre)).limit(1);
    if (existePorLetra.length === 0 && existePorNombre.length === 0) {
      await db.insert(clientes).values({
        nombre: c.nombre,
        letra: c.letra,
        nit: c.nit ?? null,
        contacto: c.contacto ?? null,
        telefono: c.telefono ?? null,
        estado: "Activo",
      });
      console.log(`  + ${c.letra} — ${c.nombre}`);
    } else {
      console.log(`  = ${c.nombre} ya existe, se omite.`);
    }
  }

  console.log("Desactivando clientes de prueba (A, B)...");
  for (const letra of LETRAS_PRUEBA) {
    await db.update(clientes).set({ estado: "Inactivo" }).where(eq(clientes.letra, letra));
  }

  console.log("Listo.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
