export const dynamic = "force-dynamic";

import { getClientes } from "@/lib/db/queries";
import { guardarCliente, eliminarCliente } from "@/lib/db/maestros-actions";
import { MaestroCrud } from "@/components/maestro-crud";

export default async function ClientesPage() {
  const data = await getClientes();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Maestro de clientes</h1>
        <p className="text-sm text-neutral-600">
          Cada cliente tiene una <strong>letra de referencia</strong> que se antepone al número de
          pedido (ej. IBELTCO = letra <strong>C</strong> → pedido <strong>C-1234</strong>). Los
          clientes de prueba precargados son datos de ensayo — edítalos o retíralos cuando tengas
          los clientes reales.
        </p>
      </div>
      <MaestroCrud
        nombreEntidad="cliente"
        campos={[
          { key: "nombre", label: "Nombre", requerido: true },
          { key: "letra", label: "Letra de referencia", requerido: true, maxLength: 1, mayusculas: true, placeholder: "Ej: C" },
          { key: "nit", label: "NIT" },
          { key: "contacto", label: "Contacto" },
          { key: "telefono", label: "Teléfono" },
        ]}
        columnasTabla={[
          { key: "letra", label: "Letra" },
          { key: "nombre", label: "Nombre" },
          { key: "nit", label: "NIT" },
          { key: "contacto", label: "Contacto" },
          { key: "telefono", label: "Teléfono" },
        ]}
        registros={data}
        onGuardar={guardarCliente}
        onEliminar={eliminarCliente}
      />
    </div>
  );
}
