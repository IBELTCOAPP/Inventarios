export const dynamic = "force-dynamic";

import { getRetalesDisponibles } from "@/lib/db/queries";

export default async function RetalesPage() {
  const data = await getRetalesDisponibles();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Retales disponibles</h1>
        <p className="text-sm text-neutral-600">
          Sobrantes de cortes previos, listos para reutilizar antes de abrir un rollo nuevo. Este
          inventario no existía en el ERP — hoy vive solo aquí.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Lote origen</th>
              <th className="px-4 py-2 font-medium">Línea</th>
              <th className="px-4 py-2 font-medium">Referencia</th>
              <th className="px-4 py-2 font-medium">Ancho (mm)</th>
              <th className="px-4 py-2 font-medium">Largo (mm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium">{r.loteOrigen}</td>
                <td className="px-4 py-2">{r.linea}</td>
                <td className="px-4 py-2">{r.referencia}</td>
                <td className="px-4 py-2">{r.anchoMm.toLocaleString("es-CO")}</td>
                <td className="px-4 py-2">{r.largoMm.toLocaleString("es-CO")}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={5}>
                  No hay retales registrados todavía. Se generan al marcar un corte como
                  &quot;retal útil&quot; desde un pedido.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
