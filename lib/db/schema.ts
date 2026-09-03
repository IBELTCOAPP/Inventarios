import {
  pgTable,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

/**
 * ROLLOS — inventario maestro de rollos (reemplaza la hoja Inventario_Rollos
 * de Planos Rollos.xlsx).
 *
 * `largo_usado_mm` es la frontera de corte acumulada del rollo: la lógica de
 * corte (ver lib/cutting-engine.ts) va "apilando" piezas en franjas (shelves)
 * a lo largo del eje Y del rollo, y este campo marca hasta dónde se ha
 * avanzado. No se persisten las franjas intermedias — se recalculan a partir
 * del histórico de cortes cuando se necesita el plano visual completo.
 */
export const rollos = pgTable("rollos", {
  id: serial("id").primaryKey(),
  lote: text("lote").notNull().unique(),
  linea: text("linea").notNull(),
  referencia: text("referencia").notNull(),
  anchoMm: doublePrecision("ancho_mm").notNull(),
  largoMm: doublePrecision("largo_mm").notNull(),
  largoUsadoMm: doublePrecision("largo_usado_mm").notNull().default(0),
  estado: text("estado").notNull().default("INICIADO"), // INICIADO | COMPLETO | AGOTADO
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * RETALES — piezas sobrantes de un corte previo (RETAL_UTIL) que quedan
 * disponibles como inventario propio, independiente del rollo de origen.
 * Este es el hueco que hoy no existe en el ERP (ver acta Sesión 2): el ERP
 * suma saldos sin saber en cuántos pedazos está repartido un total.
 */
export const retales = pgTable("retales", {
  id: serial("id").primaryKey(),
  loteOrigen: text("lote_origen").notNull(),
  linea: text("linea").notNull(),
  referencia: text("referencia").notNull(),
  anchoMm: doublePrecision("ancho_mm").notNull(),
  largoMm: doublePrecision("largo_mm").notNull(),
  disponible: boolean("disponible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * CORTES — bitácora de cada corte realizado (reemplaza Historico_Cortes).
 * Sirve tanto de trazabilidad como de fuente para reconstruir el plano
 * visual de un rollo (X/Y de cada pieza cortada).
 */
export const cortes = pgTable("cortes", {
  id: serial("id").primaryKey(),
  lote: text("lote").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).defaultNow(),
  pedidoTaller: text("pedido_taller"),
  cliente: text("cliente"),
  anchoMm: doublePrecision("ancho_mm").notNull(),
  largoMm: doublePrecision("largo_mm").notNull(),
  areaMm2: doublePrecision("area_mm2"),
  // VENDIDO | RETAL_UTIL | ELIMINADO
  estado: text("estado").notNull().default("VENDIDO"),
  operario: text("operario"),
  xInicial: doublePrecision("x_inicial").notNull(),
  yInicial: doublePrecision("y_inicial").notNull(),
  // origen del material: "rollo" o "retal", y el id del retal si aplica
  origenTipo: text("origen_tipo").notNull().default("rollo"),
  origenRetalId: integer("origen_retal_id"),
});

/**
 * ANCHOS_ANALISIS — snapshot del análisis Pareto de anchos vendidos
 * (Analisis Anchos Malla teflon Cafe.xlsx), usado para recomendaciones de
 * compra. Solo lectura desde la UI por ahora.
 */
export const anchosAnalisis = pgTable("anchos_analisis", {
  id: serial("id").primaryKey(),
  anchoMm: doublePrecision("ancho_mm").notNull(),
  pedidos: integer("pedidos").notNull(),
  unidadesVendidas: integer("unidades_vendidas").notNull(),
  pctTotal: doublePrecision("pct_total").notNull(),
  pctAcumulado: doublePrecision("pct_acumulado").notNull(),
});
