export const dynamic = "force-dynamic";

import { getRollos, getLineasMaestroActivas, getProveedoresActivos } from "@/lib/db/queries";
import { RolloForm } from "@/components/rollo-form";
import { requireUsuario } from "@/lib/auth";

export default async function RollosPage() {
  await requireUsuario("rollos");
  const [data, lineasData, proveedoresData] = await Promise.all([
    getRollos(),
    getLineasMaestroActivas(),
    getProveedoresActivos(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Inventario de rollos</h1>
        <p className="text-sm text-neutral-600">
          {data.length} rollos — reemplaza la hoja Inventario_Rollos de Planos Rollos.xlsx.
        </p>
      </div>
      <RolloForm
        rollos={data}
        lineas={lineasData.map((l) => l.nombre)}
        proveedores={proveedoresData.map((p) => p.nombre)}
      />
    </div>
  );
}
