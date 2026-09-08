"use server";

import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verificarPassword, crearSesion } from "@/lib/auth";
import { redirect } from "next/navigation";

export type ResultadoLogin = { ok: true } | { ok: false; error: string };

export async function iniciarSesion(input: { email: string; password: string }): Promise<ResultadoLogin> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "Completa correo y contraseña." };
  }

  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  // Mensaje genérico en ambos casos (no existe / clave mala) para no revelar
  // qué correos están registrados en la app.
  if (!usuario || usuario.estado !== "Activo") {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  const passwordOk = await verificarPassword(input.password, usuario.passwordHash);
  if (!passwordOk) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }

  await crearSesion(usuario.id);
  redirect("/");
}
