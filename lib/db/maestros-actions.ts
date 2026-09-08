"use server";

/**
 * Server actions de los 4 maestros (Operarios, Líneas, Clientes,
 * Proveedores): ingresar, modificar y retirar datos, como pidió el
 * cliente. Los cortes/pedidos guardan cliente y operario como texto
 * (columnas denormalizadas, ver schema.ts) así que retirar un registro
 * del maestro no rompe el histórico — solo deja de aparecer en los
 * desplegables para pedidos nuevos.
 */

import { db } from "./index";
import { operarios, lineas, clientes, proveedores } from "./schema";
import { eq, ne, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Resultado = { ok: true } | { ok: false; error: string };

// ------------------------------------------------------------------
// OPERARIOS
// ------------------------------------------------------------------

export async function guardarOperario(input: {
  id?: number;
  nombre: string;
  estado: string;
}): Promise<Resultado> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };

  if (input.id) {
    await db.update(operarios).set({ nombre, estado: input.estado }).where(eq(operarios.id, input.id));
  } else {
    await db.insert(operarios).values({ nombre, estado: input.estado });
  }
  revalidatePath("/operarios");
  return { ok: true };
}

export async function eliminarOperario(id: number): Promise<Resultado> {
  await db.delete(operarios).where(eq(operarios.id, id));
  revalidatePath("/operarios");
  return { ok: true };
}

// ------------------------------------------------------------------
// LÍNEAS
// ------------------------------------------------------------------

export async function guardarLinea(input: {
  id?: number;
  nombre: string;
  estado: string;
}): Promise<Resultado> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre de la línea es obligatorio." };

  const duplicado = await db
    .select()
    .from(lineas)
    .where(input.id ? and(eq(lineas.nombre, nombre), ne(lineas.id, input.id)) : eq(lineas.nombre, nombre))
    .limit(1);
  if (duplicado.length > 0) return { ok: false, error: `Ya existe una línea llamada "${nombre}".` };

  if (input.id) {
    await db.update(lineas).set({ nombre, estado: input.estado }).where(eq(lineas.id, input.id));
  } else {
    await db.insert(lineas).values({ nombre, estado: input.estado });
  }
  revalidatePath("/lineas");
  return { ok: true };
}

export async function eliminarLinea(id: number): Promise<Resultado> {
  await db.delete(lineas).where(eq(lineas.id, id));
  revalidatePath("/lineas");
  return { ok: true };
}

// ------------------------------------------------------------------
// CLIENTES
// ------------------------------------------------------------------

export async function guardarCliente(input: {
  id?: number;
  nombre: string;
  letra: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  estado: string;
}): Promise<Resultado> {
  const nombre = input.nombre.trim();
  const letra = input.letra.trim().toUpperCase();
  if (!nombre) return { ok: false, error: "El nombre del cliente es obligatorio." };
  if (!/^[A-Z]$/.test(letra)) return { ok: false, error: "La letra de referencia debe ser una sola letra (A-Z)." };

  const duplicado = await db
    .select()
    .from(clientes)
    .where(input.id ? and(eq(clientes.letra, letra), ne(clientes.id, input.id)) : eq(clientes.letra, letra))
    .limit(1);
  if (duplicado.length > 0) {
    return { ok: false, error: `La letra "${letra}" ya está asignada a otro cliente.` };
  }

  const valores = {
    nombre,
    letra,
    nit: input.nit?.trim() || null,
    contacto: input.contacto?.trim() || null,
    telefono: input.telefono?.trim() || null,
    estado: input.estado,
  };

  if (input.id) {
    await db.update(clientes).set(valores).where(eq(clientes.id, input.id));
  } else {
    await db.insert(clientes).values(valores);
  }
  revalidatePath("/clientes");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}

export async function eliminarCliente(id: number): Promise<Resultado> {
  await db.delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/clientes");
  revalidatePath("/pedidos/nuevo");
  return { ok: true };
}

// ------------------------------------------------------------------
// PROVEEDORES
// ------------------------------------------------------------------

export async function guardarProveedor(input: {
  id?: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  estado: string;
}): Promise<Resultado> {
  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "El nombre del proveedor es obligatorio." };

  const valores = {
    nombre,
    contacto: input.contacto?.trim() || null,
    telefono: input.telefono?.trim() || null,
    estado: input.estado,
  };

  if (input.id) {
    await db.update(proveedores).set(valores).where(eq(proveedores.id, input.id));
  } else {
    await db.insert(proveedores).values(valores);
  }
  revalidatePath("/proveedores");
  return { ok: true };
}

export async function eliminarProveedor(id: number): Promise<Resultado> {
  await db.delete(proveedores).where(eq(proveedores.id, id));
  revalidatePath("/proveedores");
  return { ok: true };
}
