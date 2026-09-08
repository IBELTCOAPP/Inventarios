export const dynamic = "force-dynamic";

import { getLineasMaestro } from "@/lib/db/queries";
import { guardarLinea, eliminarLinea } from "@/lib/db/maestros-actions";
import { MaestroCrud } from "@/components/maestro-crud";

export default async function LineasPage() {
  const data = await getLineasMaestro();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Maestro de tipos de línea</h1>
        <p className="text-sm text-neutral-600">
          Se usa como desplegable al registrar rollos, retales y pedidos.
        </p>
      </div>
      <MaestroCrud
        nombreEntidad="línea"
        campos={[{ key: "nombre", label: "Nombre", requerido: true, placeholder: "Ej: PVC" }]}
        columnasTabla={[{ key: "nombre", label: "Nombre" }]}
        registros={data}
        onGuardar={guardarLinea}
        onEliminar={eliminarLinea}
      />
    </div>
  );
}
