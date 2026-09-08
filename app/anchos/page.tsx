export const dynamic = "force-dynamic";

import { getAnchosAnalisis } from "@/lib/db/queries";
import { requireUsuario } from "@/lib/auth";

export default async function AnchosPage() {
  await requireUsuario("anchos");
  const data = await getAnchosAnalisis();
  const top15 = data.slice(0, 15);
  const maxUnidades = Math.max(...top15.map((a) => a.unidadesVendidas), 1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Análisis de anchos vendidos</h1>
        <p className="text-sm text-neutral-600">
          Ranking de anchos (mm) por unidades vendidas — reemplaza Analisis Anchos Malla teflon
          Cafe.xlsx. Úsalo para decidir qué anchos pre-cortados conviene tener en stock.
        </p>
      </div>

      <div className="card p-5">
        <div className="space-y-2">
          {top15.map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <div className="w-16 shrink-0 text-right font-medium">{a.anchoMm} mm</div>
              <div className="h-4 flex-1 rounded bg-neutral-100">
                <div
                  className="h-4 rounded bg-gradient-to-r from-brand-500 to-brand-400"
                  style={{ width: `${(a.unidadesVendidas / maxUnidades) * 100}%` }}
                />
              </div>
              <div className="w-28 shrink-0 text-neutral-500">
                {a.unidadesVendidas} u. · {(a.pctTotal * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Ancho (mm)</th>
              <th className="px-4 py-2 font-medium">Pedidos</th>
              <th className="px-4 py-2 font-medium">Unidades vendidas</th>
              <th className="px-4 py-2 font-medium">% del total</th>
              <th className="px-4 py-2 font-medium">% acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 font-medium">{a.anchoMm}</td>
                <td className="px-4 py-2">{a.pedidos}</td>
                <td className="px-4 py-2">{a.unidadesVendidas}</td>
                <td className="px-4 py-2">{(a.pctTotal * 100).toFixed(1)}%</td>
                <td className="px-4 py-2">{(a.pctAcumulado * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
