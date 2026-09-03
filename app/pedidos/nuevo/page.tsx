export const dynamic = "force-dynamic";

import { getLineasReferencias } from "@/lib/db/queries";
import { NuevoPedidoForm } from "@/components/nuevo-pedido-form";

export default async function NuevoPedidoPage() {
  const opciones = await getLineasReferencias();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nuevo pedido</h1>
        <p className="text-sm text-neutral-600">
          Indica qué necesita el cliente y el motor de corte te dice exactamente de qué rollo o
          retal cortarlo, y en qué coordenadas.
        </p>
      </div>
      <NuevoPedidoForm opciones={opciones} />
    </div>
  );
}
