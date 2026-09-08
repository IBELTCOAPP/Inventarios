import { db } from "./index";
import { rollos, retales, cortes, anchosAnalisis, operarios, lineas, clientes, proveedores } from "./schema";
import { eq, desc, and } from "drizzle-orm";

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
