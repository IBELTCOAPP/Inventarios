"use server";

import { db } from "@/lib/db";
import { rollos, retales, cortes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getRollosActivosPorReferencia, getRetalesPorReferencia, getCortesPorLote } from "@/lib/db/queries";
import { sugerirCorte, type SugerenciaCorte, type PiezaRequerida } from "@/lib/cutting-engine";

export type ResultadoBusqueda =
  | { ok: true; sugerencia: SugerenciaCorte; pieza: PiezaRequerida }
  | { ok: false; error: string };

export async function buscarSugerencia(input: {
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
}): Promise<ResultadoBusqueda> {
  const { linea, referencia, anchoMm, largoMm } = input;
  if (!linea || !referencia) return { ok: false, error: "Selecciona línea y referencia." };
  if (!(anchoMm > 0) || !(largoMm > 0)) {
    return { ok: false, error: "Ancho y largo deben ser mayores a cero." };
  }

  const pieza: PiezaRequerida = { linea, referencia, anchoMm, largoMm };

  const [rollosActivos, retalesDisponibles] = await Promise.all([
    getRollosActivosPorReferencia(linea, referencia),
    getRetalesPorReferencia(linea, referencia),
  ]);

  const cortesPorRollo = new Map<
    string,
    { xInicial: number; yInicial: number; anchoMm: number; largoMm: number }[]
  >();
  for (const r of rollosActivos) {
    const cs = await getCortesPorLote(r.lote);
    cortesPorRollo.set(
      r.lote,
      cs.map((c) => ({ xInicial: c.xInicial, yInicial: c.yInicial, anchoMm: c.anchoMm, largoMm: c.largoMm }))
    );
  }

  const sugerencia = sugerirCorte(pieza, retalesDisponibles, rollosActivos, cortesPorRollo);
  return { ok: true, sugerencia, pieza };
}

export async function confirmarCorte(input: {
  sugerencia: SugerenciaCorte;
  pieza: PiezaRequerida;
  cliente: string;
  pedidoTaller: string;
  operario: string;
}): Promise<{ ok: true; lote: string } | { ok: false; error: string }> {
  const { sugerencia, pieza, cliente, pedidoTaller, operario } = input;

  if (sugerencia.tipo === "sin_material") {
    return { ok: false, error: "No hay material disponible para confirmar." };
  }

  if (sugerencia.tipo === "retal") {
    const [retal] = await db.select().from(retales).where(eq(retales.id, sugerencia.retalId)).limit(1);
    if (!retal || !retal.disponible) {
      return { ok: false, error: "Ese retal ya no está disponible (puede que otro pedido lo haya usado)." };
    }

    await db.insert(cortes).values({
      lote: retal.loteOrigen,
      pedidoTaller,
      cliente,
      anchoMm: pieza.anchoMm,
      largoMm: pieza.largoMm,
      areaMm2: pieza.anchoMm * pieza.largoMm,
      estado: "VENDIDO",
      operario,
      xInicial: 0,
      yInicial: 0,
      origenTipo: "retal",
      origenRetalId: retal.id,
    });

    // El retal usado se consume. Si sobra un remanente aprovechable en
    // alguna de las dos dimensiones, se parte en un retal nuevo (corte
    // guillotina simple, prioriza el sobrante de ancho).
    await db.update(retales).set({ disponible: false }).where(eq(retales.id, retal.id));

    const MIN_UTIL_MM = 50; // por debajo de esto, el sobrante se considera desperdicio
    const sobranteAncho = retal.anchoMm - pieza.anchoMm;
    const sobranteLargo = retal.largoMm - pieza.largoMm;
    if (sobranteAncho >= MIN_UTIL_MM) {
      await db.insert(retales).values({
        loteOrigen: retal.loteOrigen,
        linea: retal.linea,
        referencia: retal.referencia,
        anchoMm: sobranteAncho,
        largoMm: retal.largoMm,
        disponible: true,
      });
    }
    if (sobranteLargo >= MIN_UTIL_MM) {
      await db.insert(retales).values({
        loteOrigen: retal.loteOrigen,
        linea: retal.linea,
        referencia: retal.referencia,
        anchoMm: pieza.anchoMm,
        largoMm: sobranteLargo,
        disponible: true,
      });
    }

    return { ok: true, lote: retal.loteOrigen };
  }

  // tipo === "rollo"
  await db.insert(cortes).values({
    lote: sugerencia.lote,
    pedidoTaller,
    cliente,
    anchoMm: pieza.anchoMm,
    largoMm: pieza.largoMm,
    areaMm2: pieza.anchoMm * pieza.largoMm,
    estado: "VENDIDO",
    operario,
    xInicial: sugerencia.xInicial,
    yInicial: sugerencia.yInicial,
    origenTipo: "rollo",
  });

  if (sugerencia.abreFranjaNueva) {
    const nuevaFrontera = sugerencia.yInicial + pieza.largoMm;
    await db
      .update(rollos)
      .set({ largoUsadoMm: sql`GREATEST(${rollos.largoUsadoMm}, ${nuevaFrontera})` })
      .where(eq(rollos.id, sugerencia.rolloId));
  }

  return { ok: true, lote: sugerencia.lote };
}
