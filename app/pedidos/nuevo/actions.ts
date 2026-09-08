"use server";

import { db } from "@/lib/db";
import { rollos, retales, cortes } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  getRollosActivosPorReferencia,
  getRetalesPorReferencia,
  getCortesPorLote,
  getRolloPorLote,
} from "@/lib/db/queries";
import { listarCandidatos, type CandidatoCorte, type PiezaRequerida } from "@/lib/cutting-engine";
import { requireSesion } from "@/lib/auth";

/** Datos para dibujar el plano de corte de un rollo — ver components/plano-de-corte.tsx. */
export type PlanoRollo = {
  anchoMm: number;
  largoMm: number;
  largoUsadoMm: number;
  cortes: {
    id: number;
    xInicial: number;
    yInicial: number;
    anchoMm: number;
    largoMm: number;
    estado: string;
    pedidoTaller: string | null;
    cliente: string | null;
  }[];
};

export type ResultadoBusqueda =
  | { ok: true; candidatos: CandidatoCorte[]; pieza: PiezaRequerida; planos: Record<string, PlanoRollo> }
  | { ok: false; error: string };

/** Busca TODAS las opciones disponibles (retales y rollos) para una pieza — no solo la mejor. */
export async function buscarDisponibilidad(input: {
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
}): Promise<ResultadoBusqueda> {
  await requireSesion();
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

  // Plano de corte de cada rollo involucrado — tanto los rollos activos
  // (candidatos directos) como el rollo de origen de cada retal candidato,
  // para poder mostrar gráficamente "el rollo con los cortes que ya tiene"
  // sin importar si el usuario terminó parado sobre un rollo o un retal.
  const planos: Record<string, PlanoRollo> = {};
  const cortesPorRollo = new Map<
    string,
    { xInicial: number; yInicial: number; anchoMm: number; largoMm: number }[]
  >();

  async function cargarPlano(lote: string, rollo: { anchoMm: number; largoMm: number; largoUsadoMm: number }) {
    if (planos[lote]) return;
    const cs = await getCortesPorLote(lote);
    planos[lote] = {
      anchoMm: rollo.anchoMm,
      largoMm: rollo.largoMm,
      largoUsadoMm: rollo.largoUsadoMm,
      cortes: cs.map((c) => ({
        id: c.id,
        xInicial: c.xInicial,
        yInicial: c.yInicial,
        anchoMm: c.anchoMm,
        largoMm: c.largoMm,
        estado: c.estado,
        pedidoTaller: c.pedidoTaller,
        cliente: c.cliente,
      })),
    };
    cortesPorRollo.set(
      lote,
      cs.map((c) => ({ xInicial: c.xInicial, yInicial: c.yInicial, anchoMm: c.anchoMm, largoMm: c.largoMm }))
    );
  }

  for (const r of rollosActivos) {
    await cargarPlano(r.lote, r);
  }
  const lotesOrigenRetal = [...new Set(retalesDisponibles.map((r) => r.loteOrigen))];
  for (const lote of lotesOrigenRetal) {
    if (planos[lote]) continue;
    const rolloOrigen = await getRolloPorLote(lote);
    if (rolloOrigen) await cargarPlano(lote, rolloOrigen);
  }

  const candidatos = listarCandidatos(pieza, retalesDisponibles, rollosActivos, cortesPorRollo);
  if (candidatos.length === 0) {
    return { ok: false, error: "No hay rollo ni retal disponible con ancho/largo suficiente para esta pieza." };
  }
  return { ok: true, candidatos, pieza, planos };
}

export type EstadoHistorico = "VENDIDO" | "RETAL_UTIL" | "ELIMINADO";

const MIN_UTIL_MM = 50; // por debajo de esto, el sobrante se considera desperdicio, no un retal nuevo

/**
 * Confirma el corte sobre la pieza elegida por el usuario (puede no ser la
 * `sugerida`), con ancho/largo/X/Y que el usuario puede haber editado desde
 * lo que el motor propuso.
 */
export async function confirmarCorte(input: {
  candidato: CandidatoCorte;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  xInicial: number;
  yInicial: number;
  clienteNombre: string;
  clienteLetra: string;
  numeroPedido: string;
  operario: string;
  estado: EstadoHistorico;
  nota?: string;
}): Promise<{ ok: true; lote: string; pedidoCodigo: string } | { ok: false; error: string }> {
  await requireSesion();
  const { candidato, anchoMm, largoMm, xInicial, yInicial, operario, estado, nota } = input;

  if (!/^\d+$/.test(input.numeroPedido.trim())) {
    return { ok: false, error: "El número de pedido debe contener únicamente dígitos." };
  }
  if (!(anchoMm > 0) || !(largoMm > 0)) {
    return { ok: false, error: "Ancho y largo a cortar deben ser mayores a cero." };
  }
  if (!operario) return { ok: false, error: "Selecciona el operario." };

  const pedidoCodigo = `${input.clienteLetra}-${input.numeroPedido.trim()}`;

  if (candidato.tipo === "retal") {
    const [retal] = await db.select().from(retales).where(eq(retales.id, candidato.retalId)).limit(1);
    if (!retal || !retal.disponible) {
      return { ok: false, error: "Ese retal ya no está disponible (puede que otro pedido lo haya usado)." };
    }
    if (anchoMm > retal.anchoMm || largoMm > retal.largoMm) {
      return { ok: false, error: `El corte no cabe en el retal (disponible: ${retal.anchoMm} x ${retal.largoMm} mm).` };
    }

    await db.insert(cortes).values({
      lote: retal.loteOrigen,
      pedidoTaller: pedidoCodigo,
      cliente: input.clienteNombre,
      anchoMm,
      largoMm,
      areaMm2: anchoMm * largoMm,
      estado,
      operario,
      xInicial,
      yInicial,
      origenTipo: "retal",
      origenRetalId: retal.id,
      nota: nota?.trim() || null,
      linea: retal.linea,
      referencia: retal.referencia,
    });

    await db.update(retales).set({ disponible: false }).where(eq(retales.id, retal.id));

    // Guillotina simple: hasta 2 sobrantes nuevos (lateral de ancho, y de largo).
    const sobranteAncho = retal.anchoMm - anchoMm;
    const sobranteLargo = retal.largoMm - largoMm;
    if (sobranteAncho >= MIN_UTIL_MM) {
      await db.insert(retales).values({
        loteOrigen: retal.loteOrigen,
        linea: retal.linea,
        referencia: retal.referencia,
        anchoMm: sobranteAncho,
        largoMm,
        disponible: true,
      });
    }
    if (sobranteLargo >= MIN_UTIL_MM) {
      await db.insert(retales).values({
        loteOrigen: retal.loteOrigen,
        linea: retal.linea,
        referencia: retal.referencia,
        anchoMm,
        largoMm: sobranteLargo,
        disponible: true,
      });
    }

    return { ok: true, lote: retal.loteOrigen, pedidoCodigo };
  }

  // tipo === "rollo"
  const [rollo] = await db.select().from(rollos).where(eq(rollos.id, candidato.rolloId)).limit(1);
  if (!rollo) return { ok: false, error: "Ese rollo ya no existe." };

  const largoDisponible = rollo.largoMm - rollo.largoUsadoMm;
  if (anchoMm > rollo.anchoMm) return { ok: false, error: "El ancho de corte no puede superar el ancho del rollo." };
  if (yInicial + largoMm > rollo.largoMm + 1e-6) {
    return { ok: false, error: `El rollo solo tiene ${largoDisponible} mm disponibles a lo largo desde Y=${yInicial}.` };
  }

  await db.insert(cortes).values({
    lote: rollo.lote,
    pedidoTaller: pedidoCodigo,
    cliente: input.clienteNombre,
    anchoMm,
    largoMm,
    areaMm2: anchoMm * largoMm,
    estado,
    operario,
    xInicial,
    yInicial,
    origenTipo: "rollo",
    nota: nota?.trim() || null,
    linea: rollo.linea,
    referencia: rollo.referencia,
  });

  const nuevaFrontera = yInicial + largoMm;
  await db
    .update(rollos)
    .set({
      largoUsadoMm: sql`GREATEST(${rollos.largoUsadoMm}, ${nuevaFrontera})`,
      estado: nuevaFrontera >= rollo.largoMm - 1e-6 ? "AGOTADO" : "INICIADO",
    })
    .where(eq(rollos.id, rollo.id));

  // Si el corte no usa todo el ancho del rollo, el sobrante lateral queda
  // como retal aprovechable (igual que con un retal usado como origen).
  const sobranteAncho = rollo.anchoMm - anchoMm;
  if (sobranteAncho >= MIN_UTIL_MM) {
    await db.insert(retales).values({
      loteOrigen: rollo.lote,
      linea: rollo.linea,
      referencia: rollo.referencia,
      anchoMm: sobranteAncho,
      largoMm,
      disponible: true,
    });
  }

  return { ok: true, lote: rollo.lote, pedidoCodigo };
}
