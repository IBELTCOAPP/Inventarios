import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, sesiones } from "@/lib/db/schema";
import { puedeVerPaginaClave, type PaginaKey } from "@/lib/pages";

/**
 * Autenticación propia (sin proveedor externo): usuario+contraseña con hash
 * bcrypt, y sesiones guardadas en la base (token opaco en una cookie
 * httpOnly) en vez de un JWT autocontenido — así desactivar un usuario
 * corta su acceso de inmediato, sin esperar a que expire un token ya
 * emitido. Ver lib/pages.ts para el registro de páginas controlables.
 */

const COOKIE_NAME = "ibelco_sesion";
const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Genera una contraseña temporal legible (para cuando el admin crea/resetea un usuario). */
export function generarPasswordTemporal(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (const b of randomBytes(10)) out += alfabeto[b % alfabeto.length];
  return out;
}

export async function crearSesion(usuarioId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);
  await db.insert(sesiones).values({ token, usuarioId, expiraEn });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

export async function destruirSesionActual(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.delete(sesiones).where(eq(sesiones.token, token));
  store.delete(COOKIE_NAME);
}

export type UsuarioSesion = typeof usuarios.$inferSelect;

export async function getUsuarioActual(): Promise<UsuarioSesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const filas = await db
    .select({ usuario: usuarios, expiraEn: sesiones.expiraEn })
    .from(sesiones)
    .innerJoin(usuarios, eq(sesiones.usuarioId, usuarios.id))
    .where(eq(sesiones.token, token))
    .limit(1);

  const fila = filas[0];
  if (!fila) return null;
  if (fila.expiraEn.getTime() < Date.now()) return null;
  if (fila.usuario.estado !== "Activo") return null;
  return fila.usuario;
}

/** Administrador ve todo siempre; el resto solo lo que el admin le haya marcado en paginasPermitidas. */
export function puedeVerPagina(usuario: UsuarioSesion, pagina: PaginaKey): boolean {
  return puedeVerPaginaClave(usuario.rol, usuario.paginasPermitidas, pagina);
}

/**
 * Para el arranque de un page.tsx: exige sesión activa y, si se pasa
 * `pagina`, permiso sobre esa página puntual — redirige a /login o
 * /sin-acceso si no se cumple. Devuelve el usuario para que la página lo
 * use (por ejemplo, para saber si mostrar controles de administrador).
 */
export async function requireUsuario(pagina?: PaginaKey): Promise<UsuarioSesion> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");
  if (pagina && !puedeVerPagina(usuario, pagina)) redirect("/sin-acceso");
  return usuario;
}

/** Para el arranque de una server action: exige sesión activa (sin chequeo de página puntual). */
export async function requireSesion(): Promise<UsuarioSesion> {
  const usuario = await getUsuarioActual();
  if (!usuario) throw new Error("Tu sesión expiró o no has iniciado sesión. Vuelve a /login.");
  return usuario;
}

/** Para server actions que además deben ser exclusivas de Administrador (ej. gestión de usuarios). */
export async function requireAdministrador(): Promise<UsuarioSesion> {
  const usuario = await requireSesion();
  if (usuario.rol !== "Administrador") throw new Error("Esta acción es solo para administradores.");
  return usuario;
}

/** Para el arranque de una página exclusiva de Administrador (ej. /usuarios): redirige en vez de lanzar error. */
export async function requireUsuarioAdministrador(): Promise<UsuarioSesion> {
  const usuario = await requireUsuario();
  if (usuario.rol !== "Administrador") redirect("/sin-acceso");
  return usuario;
}
