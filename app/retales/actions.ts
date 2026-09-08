"use server";

import { db } from "@/lib/db";
import { retales } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Resultado = { ok: true } | { ok: false; error: string };

export async function guardarRetal(input: {
  id?: number;
  loteOrigen?: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  disponible: boolean;
}): Promise<Resultado> {
  if (!input.linea || !input.referencia) {
    return { ok: false, error: "Línea y referencia son obligatorias." };
  }
  if (!(input.anchoMm > 0) || !(input.largoMm > 0)) {
    return { ok: false, error: "Ancho y largo deben ser mayores a cero." };
  }

  const valores = {
    loteOrigen: input.loteOrigen?.trim() || "MANUAL",
    linea: input.linea,
    referencia: input.referencia.trim(),
    anchoMm: input.anchoMm,
    largoMm: input.largoMm,
    disponible: input.disponible,
  };

  if (input.id) {
    await db.update(retales).set(valores).where(eq(retales.id, input.id));
  } else {
    await db.insert(retales).values(valores);
  }
  revalidatePath("/retales");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}

export async function eliminarRetal(id: number): Promise<Resultado> {
  await db.delete(retales).where(eq(retales.id, id));
  revalidatePath("/retales");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}
