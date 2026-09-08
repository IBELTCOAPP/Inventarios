"use server";

import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSesion, verificarPassword, hashPassword } from "@/lib/auth";

export type ResultadoCambio = { ok: true } | { ok: false; error: string };

export async function cambiarMiPassword(input: { passwordActual: string; passwordNueva: string }): Promise<ResultadoCambio> {
  const usuario = await requireSesion();

  if (input.passwordNueva.length < 8) {
    return { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }
  const actualOk = await verificarPassword(input.passwordActual, usuario.passwordHash);
  if (!actualOk) {
    return { ok: false, error: "La contraseña actual no es correcta." };
  }

  const nuevoHash = await hashPassword(input.passwordNueva);
  await db.update(usuarios).set({ passwordHash: nuevoHash }).where(eq(usuarios.id, usuario.id));
  return { ok: true };
}
