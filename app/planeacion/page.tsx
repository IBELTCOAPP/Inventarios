export const dynamic = "force-dynamic";

import { getFilasPlaneacion, VENTANA_DIAS_DEMANDA } from "@/lib/planeacion";
import { PlaneacionTable } from "@/components/planeacion-table";

export default async function PlaneacionPage() {
  const filas = await getFilasPlaneacion();
  const nReordenar = filas.filter((f) => f.estado === "REORDENAR").length;
  const nOk = filas.filter((f) => f.estado === "OK").length;
  const nSinDemanda = filas.filter((f) => f.estado === "SIN_DEMANDA").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Planeación de inventario</h1>
        <p className="text-sm text-neutral-600">
          Planeación de demanda (ritmo de venta de los últimos {VENTANA_DIAS_DEMANDA} días), punto de
          reorden y cantidad sugerida a pedir, por línea+referencia — política (s, S) clásica: pedir
          cuando el stock cae por debajo del punto de reorden, hasta el nivel objetivo. Ajusta el{" "}
          <strong>tiempo de reposición del proveedor</strong> y la <strong>cobertura objetivo</strong>{" "}
          de cada referencia; por defecto queda en 30/30 días hasta que Diego los calibre.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-3xl font-semibold text-red-700">{nReordenar}</div>
          <div className="mt-1 text-sm text-neutral-500">Para reordenar ya</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-semibold text-emerald-700">{nOk}</div>
          <div className="mt-1 text-sm text-neutral-500">Stock suficiente</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-semibold text-neutral-500">{nSinDemanda}</div>
          <div className="mt-1 text-sm text-neutral-500">Sin ventas en {VENTANA_DIAS_DEMANDA} días</div>
        </div>
      </div>

      <PlaneacionTable filas={filas} />
    </div>
  );
}
