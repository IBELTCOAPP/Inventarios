/**
 * Carga la base de datos con el inventario histórico de Ibelco, tal como
 * estaba en Planos Rollos.xlsx y Analisis Anchos Malla teflon Cafe.xlsx al
 * 2026-09-02. Es una carga de una sola vez para arrancar el aplicativo con
 * datos reales; de ahí en adelante el inventario se actualiza desde la app.
 *
 * Uso: npm run db:seed
 */
import "./env";

import { db } from "../lib/db";
import { rollos, cortes, anchosAnalisis } from "../lib/db/schema";
import rollosData from "./seed_rollos.json";
import cortesData from "./seed_cortes.json";
import anchosData from "./seed_anchos.json";

type RolloSeed = {
  lote: string;
  linea: string;
  referencia: string;
  ancho_mm: number;
  largo_mm: number;
  estado: string | null;
};

type CorteSeed = {
  lote: string;
  fecha: string | null;
  pedido_taller: string | null;
  cliente: string | null;
  ancho_mm: number;
  largo_mm: number;
  area_mm2: number;
  estado: string | null;
  operario: string | null;
  x_inicial: number;
  y_inicial: number;
};

function normEstado(raw: string | null, fallback: string) {
  if (!raw) return fallback;
  const t = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (t === "RETAL_UTIL" || t === "VENDIDO" || t === "ELIMINADO") return t;
  if (t === "COMPLETO" || t === "INICIADO" || t === "AGOTADO") return t;
  return fallback;
}

async function main() {
  // Script idempotente: se puede volver a correr sin duplicar datos.
  console.log("Limpiando datos previos de la carga histórica...");
  await db.delete(cortes);
  await db.delete(anchosAnalisis);
  await db.delete(rollos);

  const rollosSeed = rollosData as RolloSeed[];
  const cortesSeed = cortesData as CorteSeed[];

  // Frontera Y ya usada por rollo, a partir del histórico de cortes
  // (para que el motor de corte no vuelva a ofrecer espacio ya ocupado).
  const largoUsadoPorLote = new Map<string, number>();
  for (const c of cortesSeed) {
    const frontera = (c.y_inicial ?? 0) + (c.largo_mm ?? 0);
    const actual = largoUsadoPorLote.get(c.lote) ?? 0;
    if (frontera > actual) largoUsadoPorLote.set(c.lote, frontera);
  }

  console.log(`Insertando ${rollosSeed.length} rollos...`);
  for (const r of rollosSeed) {
    await db
      .insert(rollos)
      .values({
        lote: r.lote,
        linea: r.linea,
        referencia: r.referencia,
        anchoMm: r.ancho_mm,
        largoMm: r.largo_mm,
        largoUsadoMm: largoUsadoPorLote.get(r.lote) ?? 0,
        estado: normEstado(r.estado, "INICIADO"),
      })
      .onConflictDoNothing({ target: rollos.lote });
  }

  console.log(`Insertando ${cortesSeed.length} cortes históricos...`);
  for (const c of cortesSeed) {
    await db.insert(cortes).values({
      lote: c.lote,
      fecha: c.fecha ? new Date(c.fecha) : new Date(),
      pedidoTaller: c.pedido_taller,
      cliente: c.cliente,
      anchoMm: c.ancho_mm,
      largoMm: c.largo_mm,
      areaMm2: c.area_mm2,
      estado: normEstado(c.estado, "VENDIDO"),
      operario: c.operario,
      xInicial: c.x_inicial ?? 0,
      yInicial: c.y_inicial ?? 0,
      origenTipo: "rollo",
    });
  }

  console.log(`Insertando ${anchosData.length} filas de análisis de anchos...`);
  for (const a of anchosData as {
    ancho_mm: number;
    pedidos: number;
    unidades_vendidas: number;
    pct_total: number;
    pct_acumulado: number;
  }[]) {
    if (typeof a.ancho_mm !== "number") continue; // fila de encabezado repetida
    await db.insert(anchosAnalisis).values({
      anchoMm: a.ancho_mm,
      pedidos: a.pedidos,
      unidadesVendidas: a.unidades_vendidas,
      pctTotal: a.pct_total,
      pctAcumulado: a.pct_acumulado,
    });
  }

  console.log("Listo.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
