"use server";

import { db } from "@/lib/db";
import { rollos } from "@/lib/db/schema";
import { eq, ne, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Resultado = { ok: true } | { ok: false; error: string };

export async function guardarRollo(input: {
  id?: number;
  lote: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  largoUsadoMm: number;
  proveedor?: string;
  estado: string;
}): Promise<Resultado> {
  const lote = input.lote.trim();
  if (!lote || !input.linea || !input.referencia) {
    return { ok: false, error: "Lote, línea y referencia son obligatorios." };
  }
  if (!(input.anchoMm > 0) || !(input.largoMm > 0)) {
    return { ok: false, error: "Ancho y largo deben ser mayores a cero." };
  }
  if (input.largoUsadoMm > input.largoMm) {
    return { ok: false, error: "El largo ya usado no puede ser mayor que el largo total." };
  }

  const duplicado = await db
    .select()
    .from(rollos)
    .where(input.id ? and(eq(rollos.lote, lote), ne(rollos.id, input.id)) : eq(rollos.lote, lote))
    .limit(1);
  if (duplicado.length > 0) return { ok: false, error: `Ya existe un rollo con el lote "${lote}".` };

  const valores = {
    lote,
    linea: input.linea,
    referencia: input.referencia.trim(),
    anchoMm: input.anchoMm,
    largoMm: input.largoMm,
    largoUsadoMm: input.largoUsadoMm,
    proveedor: input.proveedor?.trim() || null,
    estado: input.estado,
  };

  if (input.id) {
    await db.update(rollos).set(valores).where(eq(rollos.id, input.id));
  } else {
    await db.insert(rollos).values(valores);
  }
  revalidatePath("/rollos");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}

export async function eliminarRollo(id: number): Promise<Resultado> {
  await db.delete(rollos).where(eq(rollos.id, id));
  revalidatePath("/rollos");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}
