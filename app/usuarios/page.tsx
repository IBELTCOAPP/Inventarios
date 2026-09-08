export const dynamic = "force-dynamic";

import { requireUsuarioAdministrador } from "@/lib/auth";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { UsuariosAdmin } from "@/components/usuarios-admin";

export default async function UsuariosPage() {
  const admin = await requireUsuarioAdministrador();
  const data = await db.select().from(usuarios).orderBy(usuarios.nombre);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Control de usuarios</h1>
        <p className="text-sm text-neutral-600">
          Crea usuarios y decide qué páginas puede ver cada uno. El rol (Administrador, Almacén,
          Operario) solo aplica un set de páginas sugerido — puedes ajustar la selección exacta por
          persona en cualquier momento. Solo un Administrador puede entrar aquí.
        </p>
      </div>
      <UsuariosAdmin
        usuarios={data.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          paginasPermitidas: u.paginasPermitidas,
          estado: u.estado,
        }))}
        miId={admin.id}
      />
    </div>
  );
}
