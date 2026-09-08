export const dynamic = "force-dynamic";

import { getProveedores } from "@/lib/db/queries";
import { guardarProveedor, eliminarProveedor } from "@/lib/db/maestros-actions";
import { MaestroCrud } from "@/components/maestro-crud";

export default async function ProveedoresPage() {
  const data = await getProveedores();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Maestro de proveedores</h1>
        <p className="text-sm text-neutral-600">
          Se usa como desplegable al registrar de qué proveedor llegó un rollo.
        </p>
      </div>
      <MaestroCrud
        nombreEntidad="proveedor"
        campos={[
          { key: "nombre", label: "Nombre", requerido: true },
          { key: "contacto", label: "Contacto" },
          { key: "telefono", label: "Teléfono" },
        ]}
        columnasTabla={[
          { key: "nombre", label: "Nombre" },
          { key: "contacto", label: "Contacto" },
          { key: "telefono", label: "Teléfono" },
        ]}
        registros={data}
        onGuardar={guardarProveedor}
        onEliminar={eliminarProveedor}
      />
    </div>
  );
}
