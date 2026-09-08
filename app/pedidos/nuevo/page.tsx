export const dynamic = "force-dynamic";

import { getLineasReferencias, getClientesActivos, getOperariosActivos } from "@/lib/db/queries";
import { NuevoPedidoForm } from "@/components/nuevo-pedido-form";

export default async function NuevoPedidoPage() {
  const [opciones, clientesData, operariosData] = await Promise.all([
    getLineasReferencias(),
    getClientesActivos(),
    getOperariosActivos(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nuevo pedido</h1>
        <p className="text-sm text-neutral-600">
          Indica qué necesita el cliente y el motor de corte te muestra qué rollos y retales
          disponibles alcanzan, con una sugerencia de mejor aprovechamiento. Puedes elegir otra
          pieza y ajustar las coordenadas antes de confirmar.
        </p>
      </div>
      <NuevoPedidoForm
        opciones={opciones}
        clientes={clientesData.map((c) => ({ id: c.id, nombre: c.nombre, letra: c.letra }))}
        operarios={operariosData.map((o) => o.nombre)}
      />
    </div>
  );
}
