/**
 * Rellena `cortes.linea`/`cortes.referencia` (agregadas para poder agrupar
 * la demanda histórica por referencia — ver lib/inventory-policy.ts) en las
 * filas que ya existían antes de que esas columnas existieran.
 *
 * `cortes.lote` siempre queda igual al lote del ROLLO de origen, incluso
 * para cortes que en realidad salieron de un retal (ver confirmarCorte en
 * app/pedidos/nuevo/actions.ts: usa `retal.loteOrigen`) — así que un solo
 * join contra `rollos` alcanza para casi todos los casos. Si algún lote ya
 * no existe en `rollos` (rollo borrado), se intenta un segundo join contra
 * `retales.loteOrigen` como respaldo.
 *
 * Idempotente: solo toca filas con linea IS NULL.
 *
 * Uso: npx tsx scripts/backfill-linea-referencia.ts
 */
import "./env";

import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const porRollo = await db.execute(sql`
    update cortes
    set linea = rollos.linea, referencia = rollos.referencia
    from rollos
    where cortes.lote = rollos.lote and cortes.linea is null
  `);
  console.log(`Actualizadas por join con rollos: ${porRollo.rowCount ?? "?"}`);

  const porRetal = await db.execute(sql`
    update cortes
    set linea = r.linea, referencia = r.referencia
    from (select distinct on (lote_origen) lote_origen, linea, referencia from retales) r
    where cortes.lote = r.lote_origen and cortes.linea is null
  `);
  console.log(`Actualizadas por join con retales (respaldo): ${porRetal.rowCount ?? "?"}`);

  const restantes = await db.execute(sql`select lote, count(*) as n from cortes where linea is null group by lote`);
  if (restantes.rows.length > 0) {
    console.log("Lotes sin línea/referencia resuelta (quedan fuera del cálculo de demanda):");
    for (const r of restantes.rows as { lote: string; n: string }[]) {
      console.log(`  - ${r.lote}: ${r.n} corte(s)`);
    }
  } else {
    console.log("Todos los cortes quedaron con línea/referencia.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
