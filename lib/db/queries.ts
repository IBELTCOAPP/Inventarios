import { db } from "./index";
import { rollos, retales, cortes, anchosAnalisis, operarios, lineas, clientes, proveedores, politicasInventario } from "./schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export async function getRollos() {
  return db.select().from(rollos).orderBy(rollos.linea, rollos.referencia);
}

export async function getRolloPorLote(lote: string) {
  const rows = await db.select().from(rollos).where(eq(rollos.lote, lote)).limit(1);
  return rows[0] ?? null;
}

export async function getCortesPorLote(lote: string) {
  return db.select().from(cortes).where(eq(cortes.lote, lote)).orderBy(cortes.yInicial);
}

export async function getRetalesTodos() {
  return db.select().from(retales).orderBy(retales.linea, retales.referencia);
}

export async function getRetalesDisponibles() {
  return db
    .select()
    .from(retales)
    .where(eq(retales.disponible, true))
    .orderBy(retales.linea, retales.referencia);
}

export async function getHistorialCortes(limit = 100) {
  return db.select().from(cortes).orderBy(desc(cortes.fecha)).limit(limit);
}

export async function getAnchosAnalisis() {
  return db
    .select()
    .from(anchosAnalisis)
    .orderBy(desc(anchosAnalisis.unidadesVendidas));
}

export async function getLineasReferencias() {
  const rows = await db
    .select({ linea: rollos.linea, referencia: rollos.referencia })
    .from(rollos)
    .where(eq(rollos.estado, "INICIADO"));
  const vistos = new Set<string>();
  const out: { linea: string; referencia: string }[] = [];
  for (const r of rows) {
    const key = `${r.linea}|||${r.referencia}`;
    if (!vistos.has(key)) {
      vistos.add(key);
      out.push(r);
    }
  }
  return out;
}

export async function getRollosActivosPorReferencia(linea: string, referencia: string) {
  return db
    .select()
    .from(rollos)
    .where(
      and(eq(rollos.linea, linea), eq(rollos.referencia, referencia), eq(rollos.estado, "INICIADO"))
    );
}

export async function getRetalesPorReferencia(linea: string, referencia: string) {
  return db
    .select()
    .from(retales)
    .where(
      and(
        eq(retales.linea, linea),
        eq(retales.referencia, referencia),
        eq(retales.disponible, true)
      )
    );
}

// ------------------------------------------------------------------
// MAESTROS — Operarios, Líneas, Clientes, Proveedores
// ------------------------------------------------------------------

export async function getOperarios() {
  return db.select().from(operarios).orderBy(operarios.nombre);
}

export async function getOperariosActivos() {
  return db.select().from(operarios).where(eq(operarios.estado, "Activo")).orderBy(operarios.nombre);
}

export async function getLineasMaestro() {
  return db.select().from(lineas).orderBy(lineas.nombre);
}

export async function getLineasMaestroActivas() {
  return db.select().from(lineas).where(eq(lineas.estado, "Activo")).orderBy(lineas.nombre);
}

export async function getClientes() {
  return db.select().from(clientes).orderBy(clientes.nombre);
}

export async function getClientesActivos() {
  return db.select().from(clientes).where(eq(clientes.estado, "Activo")).orderBy(clientes.nombre);
}

export async function getProveedores() {
  return db.select().from(proveedores).orderBy(proveedores.nombre);
}

export async function getProveedoresActivos() {
  return db.select().from(proveedores).where(eq(proveedores.estado, "Activo")).orderBy(proveedores.nombre);
}

// ------------------------------------------------------------------
// POLÍTICA DE INVENTARIO — planeación de demanda, de pedidos y puntos de
// reorden (ver lib/inventory-policy.ts para las fórmulas).
// ------------------------------------------------------------------

function clave(linea: string, referencia: string) {
  return `${linea}|||${referencia}`;
}

/** Toda referencia con la que el sistema tiene algo de historia — de rollos, retales o cortes. */
export async function getReferenciasTodas(): Promise<{ linea: string; referencia: string }[]> {
  const [deRollos, deRetales, deCortes] = await Promise.all([
    db.selectDistinct({ linea: rollos.linea, referencia: rollos.referencia }).from(rollos),
    db.selectDistinct({ linea: retales.linea, referencia: retales.referencia }).from(retales),
    db
      .selectDistinct({ linea: cortes.linea, referencia: cortes.referencia })
      .from(cortes)
      .where(sql`${cortes.linea} is not null`),
  ]);
  const vistos = new Map<string, { linea: string; referencia: string }>();
  for (const r of [...deRollos, ...deRetales, ...(deCortes as { linea: string; referencia: string }[])]) {
    vistos.set(clave(r.linea, r.referencia), r);
  }
  return [...vistos.values()].sort((a, b) => a.linea.localeCompare(b.linea) || a.referencia.localeCompare(b.referencia));
}

/** m² disponibles ahora mismo por línea+referencia: rollos activos (largo disponible) + retales disponibles. */
export async function getStockActualPorReferencia(): Promise<Map<string, number>> {
  const stock = new Map<string, number>();
  const filasRollos = await db
    .select({
      linea: rollos.linea,
      referencia: rollos.referencia,
      m2: sql<number>`coalesce(sum(${rollos.anchoMm} * greatest(${rollos.largoMm} - ${rollos.largoUsadoMm}, 0)), 0) / 1000000.0`,
    })
    .from(rollos)
    .groupBy(rollos.linea, rollos.referencia);
  for (const f of filasRollos) stock.set(clave(f.linea, f.referencia), (stock.get(clave(f.linea, f.referencia)) ?? 0) + Number(f.m2));

  const filasRetales = await db
    .select({
      linea: retales.linea,
      referencia: retales.referencia,
      m2: sql<number>`coalesce(sum(${retales.anchoMm} * ${retales.largoMm}), 0) / 1000000.0`,
    })
    .from(retales)
    .where(eq(retales.disponible, true))
    .groupBy(retales.linea, retales.referencia);
  for (const f of filasRetales) stock.set(clave(f.linea, f.referencia), (stock.get(clave(f.linea, f.referencia)) ?? 0) + Number(f.m2));

  return stock;
}

/** m² vendidos por línea+referencia en los últimos `dias` días (para calcular demanda diaria promedio). */
export async function getDemandaRecientePorReferencia(dias = 90): Promise<Map<string, number>> {
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const filas = await db
    .select({
      linea: cortes.linea,
      referencia: cortes.referencia,
      m2: sql<number>`coalesce(sum(${cortes.areaMm2}), 0) / 1000000.0`,
    })
    .from(cortes)
    .where(and(eq(cortes.estado, "VENDIDO"), gte(cortes.fecha, desde), sql`${cortes.linea} is not null`))
    .groupBy(cortes.linea, cortes.referencia);
  const demanda = new Map<string, number>();
  for (const f of filas) if (f.linea && f.referencia) demanda.set(clave(f.linea, f.referencia), Number(f.m2));
  return demanda;
}

export async function getPoliticasInventario(): Promise<Map<string, typeof politicasInventario.$inferSelect>> {
  const filas = await db.select().from(politicasInventario);
  const mapa = new Map<string, typeof politicasInventario.$inferSelect>();
  for (const f of filas) mapa.set(clave(f.linea, f.referencia), f);
  return mapa;
}
