export const dynamic = "force-dynamic";

import { getOperarios } from "@/lib/db/queries";
import { guardarOperario, eliminarOperario } from "@/lib/db/maestros-actions";
import { MaestroCrud } from "@/components/maestro-crud";

export default async function OperariosPage() {
  const data = await getOperarios();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Maestro de operarios</h1>
        <p className="text-sm text-neutral-600">
          Se usa como desplegable al registrar quién hizo cada corte.
        </p>
      </div>
      <MaestroCrud
        nombreEntidad="operario"
        campos={[{ key: "nombre", label: "Nombre", requerido: true }]}
        columnasTabla={[{ key: "nombre", label: "Nombre" }]}
        registros={data}
        onGuardar={guardarOperario}
        onEliminar={eliminarOperario}
      />
    </div>
  );
}
