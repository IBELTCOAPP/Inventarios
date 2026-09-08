"use server";

import { db } from "@/lib/db";
import { usuarios, sesiones } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdministrador, hashPassword, generarPasswordTemporal } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { PaginaKey, Rol } from "@/lib/pages";

export type ResultadoUsuario = { ok: true; passwordTemporal?: string } | { ok: false; error: string };

/**
 * Crea un usuario. Si no se da contraseña, se genera una temporal y se
 * devuelve en el resultado para que el admin la copie y se la pase a la
 * persona — no se envía por correo (la app no tiene un servicio de correo
 * configurado) ni se vuelve a mostrar después.
 */
export async function crearUsuario(input: {
  nombre: string;
  email: string;
  rol: Rol;
  paginasPermitidas: PaginaKey[];
  password?: string;
}): Promise<ResultadoUsuario> {
  await requireAdministrador();

  const nombre = input.nombre.trim();
  const email = input.email.trim().toLowerCase();
  if (!nombre || !email) return { ok: false, error: "Nombre y correo son obligatorios." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Correo inválido." };

  const existente = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (existente[0]) return { ok: false, error: "Ya existe un usuario con ese correo." };

  const passwordTemporal = input.password?.trim() || generarPasswordTemporal();
  if (passwordTemporal.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
  const passwordHash = await hashPassword(passwordTemporal);

  await db.insert(usuarios).values({
    nombre,
    email,
    passwordHash,
    rol: input.rol,
    paginasPermitidas: input.paginasPermitidas,
    estado: "Activo",
  });

  revalidatePath("/usuarios");
  return { ok: true, passwordTemporal };
}

export async function actualizarUsuario(input: {
  id: number;
  nombre: string;
  rol: Rol;
  paginasPermitidas: PaginaKey[];
  estado: "Activo" | "Inactivo";
}): Promise<ResultadoUsuario> {
  const admin = await requireAdministrador();
  if (input.id === admin.id && input.estado === "Inactivo") {
    return { ok: false, error: "No puedes desactivar tu propio usuario." };
  }
  if (input.id === admin.id && input.rol !== "Administrador") {
    return { ok: false, error: "No puedes quitarte a ti mismo el rol de Administrador." };
  }

  await db
    .update(usuarios)
    .set({
      nombre: input.nombre.trim(),
      rol: input.rol,
      paginasPermitidas: input.paginasPermitidas,
      estado: input.estado,
    })
    .where(eq(usuarios.id, input.id));

  revalidatePath("/usuarios");
  return { ok: true };
}

export async function resetearPassword(usuarioId: number): Promise<ResultadoUsuario> {
  await requireAdministrador();
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await hashPassword(passwordTemporal);
  await db.update(usuarios).set({ passwordHash }).where(eq(usuarios.id, usuarioId));
  revalidatePath("/usuarios");
  return { ok: true, passwordTemporal };
}

export async function eliminarUsuario(usuarioId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdministrador();
  if (usuarioId === admin.id) return { ok: false, error: "No puedes eliminar tu propio usuario." };

  await db.delete(sesiones).where(eq(sesiones.usuarioId, usuarioId));
  await db.delete(usuarios).where(eq(usuarios.id, usuarioId));

  revalidatePath("/usuarios");
  return { ok: true };
}
