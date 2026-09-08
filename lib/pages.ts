/**
 * Registro central de "páginas" controlables por el módulo de usuarios
 * (ver lib/auth.ts y app/usuarios/). Cada página del menú principal y de
 * maestros tiene una clave aquí; el administrador decide, por usuario,
 * cuáles de estas puede ver (independiente del rol) — ver
 * `usuarios.paginasPermitidas` en lib/db/schema.ts.
 *
 * "/" (inicio), "/manual" y "/cambiar-password" NO están en este registro
 * a propósito: cualquier usuario autenticado puede verlas siempre, sin
 * necesidad de permiso explícito.
 */

export const PAGINAS = [
  { key: "rollos", label: "Rollos", href: "/rollos", grupo: "principal" },
  { key: "retales", label: "Retales", href: "/retales", grupo: "principal" },
  { key: "pedidos", label: "Nuevo pedido", href: "/pedidos/nuevo", grupo: "principal" },
  { key: "historial", label: "Historial", href: "/historial", grupo: "principal" },
  { key: "anchos", label: "Análisis de anchos", href: "/anchos", grupo: "principal" },
  { key: "planeacion", label: "Planeación", href: "/planeacion", grupo: "principal" },
  { key: "clientes", label: "Clientes", href: "/clientes", grupo: "maestros" },
  { key: "proveedores", label: "Proveedores", href: "/proveedores", grupo: "maestros" },
  { key: "lineas", label: "Tipos de línea", href: "/lineas", grupo: "maestros" },
  { key: "operarios", label: "Operarios", href: "/operarios", grupo: "maestros" },
  { key: "usuarios", label: "Usuarios", href: "/usuarios", grupo: "administracion" },
] as const;

export type PaginaKey = (typeof PAGINAS)[number]["key"];

export const ROLES = ["Administrador", "Almacen", "Operario"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  Administrador: "Administrador",
  Almacen: "Almacén",
  Operario: "Operario",
};

/**
 * Set de páginas sugerido al crear un usuario de cada rol — el
 * administrador lo puede ajustar de inmediato por persona. Administrador
 * ve todo siempre (ver lib/auth.ts `puedeVerPagina`), así que su entrada
 * aquí solo importa como valor inicial visual del formulario.
 */
export const PAGINAS_POR_ROL: Record<Rol, PaginaKey[]> = {
  Administrador: PAGINAS.map((p) => p.key),
  // Almacén: administra inventario y operación día a día, pero no usuarios.
  Almacen: ["rollos", "retales", "pedidos", "historial", "anchos", "planeacion", "clientes", "proveedores", "lineas", "operarios"],
  // Operario: solo lo que necesita para cortar y consultar disponibilidad.
  Operario: ["rollos", "retales", "pedidos", "historial"],
};

/**
 * Lógica pura de "¿este usuario puede ver esta página?" — sin acceso a
 * base de datos ni cookies, para poder usarse igual desde el servidor
 * (lib/auth.ts) y desde un componente cliente (components/site-nav.tsx)
 * sin duplicar la regla. Administrador ve todo siempre.
 */
export function puedeVerPaginaClave(rol: string, paginasPermitidas: string[], pagina: PaginaKey): boolean {
  if (rol === "Administrador") return true;
  return paginasPermitidas.includes(pagina);
}
