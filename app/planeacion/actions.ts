"use server";

import { db } from "@/lib/db";
import { politicasInventario } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ResultadoGuardar = { ok: true } | { ok: false; error: string };

/**
 * Crea o actualiza la política (lead time, cobertura objetivo, stock de
 * seguridad) de una línea+referencia — un renglón por referencia, sin
 * unique constraint en la base (igual que rollos/retales usan texto libre
 * para referencia), así que el "upsert" se resuelve buscando primero.
 */
export async function guardarPolitica(input: {
  linea: string;
  referencia: string;
  leadTimeDias: number;
  diasCoberturaObjetivo: number;
  stockSeguridadM2: number;
}): Promise<ResultadoGuardar> {
  const { linea, referencia } = input;
  if (!linea || !referencia) return { ok: false, error: "Falta línea o referencia." };
  if (!(input.leadTimeDias >= 0) || !(input.diasCoberturaObjetivo >= 0) || !(input.stockSeguridadM2 >= 0)) {
    return { ok: false, error: "Lead time, cobertura objetivo y stock de seguridad deben ser ≥ 0." };
  }

  const existente = await db
    .select({ id: politicasInventario.id })
    .from(politicasInventario)
    .where(and(eq(politicasInventario.linea, linea), eq(politicasInventario.referencia, referencia)))
    .limit(1);

  const valores = {
    leadTimeDias: Math.round(input.leadTimeDias),
    diasCoberturaObjetivo: Math.round(input.diasCoberturaObjetivo),
    stockSeguridadM2: input.stockSeguridadM2,
    updatedAt: new Date(),
  };

  if (existente[0]) {
    await db.update(politicasInventario).set(valores).where(eq(politicasInventario.id, existente[0].id));
  } else {
    await db.insert(politicasInventario).values({ linea, referencia, ...valores });
  }

  revalidatePath("/planeacion");
  return { ok: true };
}
